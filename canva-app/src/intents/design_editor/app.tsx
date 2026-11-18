// inbxify · Ad Maker match sheet · Canva app (side panel)
// v0.1.0 (18 Nov 2026, Ad Maker Build S1)
//
// What it does: opened on a design that inbxify Ad Maker sent to Canva, it asks ix-canva for that design's job and
// shows the match sheet read off the original ad: every colour with its hex code, and every line of text with the
// closest Canva font, weight, size and colour. "Add" drops a line onto the design in that font, size and colour, where
// it sat in the original ad (or stacked down the left when the shape changed). "Add all words" does every line.
//
// Talks to: ix-canva GET /app/job (Authorization: Bearer <Canva user token>, X-Design-Token: <design token>);
// ix-canva verifies both against this app's public keys and finds the job by the design id.
//
// HARDCODING (HC delta Ad Maker Build S1): HC-P-CAPP1-1 BACKEND (from .env CANVA_BACKEND_HOST at build time);
// HC-P-CAPP1-2 POLL_MS 3 s × 40 while the sheet is being read; HC-P-CAPP1-3 SHAPE_TOLERANCE 15 % (when the design's
// proportions differ more than this from the original ad, lines stack down the left instead of keeping their places).

import {
  Alert,
  Badge,
  Box,
  Button,
  Column,
  Columns,
  LoadingIndicator,
  Rows,
  Swatch,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { findFonts } from "@canva/asset";
import type { Font, FontRef, FontWeightName } from "@canva/asset";
import {
  addElementAtPoint,
  getDesignMetadata,
  getDesignToken,
} from "@canva/design";
import { auth } from "@canva/user";
import { useEffect, useRef, useState } from "react";
import * as styles from "styles/components.css";

const APP_VERSION = "0.1.0";
const BACKEND = BACKEND_HOST.replace(/\/+$/, "");
const POLL_MS = 3000;
const POLL_MAX = 40;
const SHAPE_TOLERANCE = 0.15;

type Box4 = { x: number; y: number; w: number; h: number };
type Line = {
  text: string;
  role?: string;
  font?: string;
  alts?: string[];
  weight?: number | string;
  sizePx?: number;
  colour?: string;
  align?: "start" | "center" | "end";
  box?: Box4;
};
type Colour = { hex: string; where?: string };
type Sheet = {
  srcW: number;
  srcH: number;
  background?: string;
  colours: Colour[];
  lines: Line[];
  made?: string;
};
type Word = {
  slot: string;
  text: string;
  font?: string;
  weight?: number;
  size?: number;
  colour?: string;
};
type Job = {
  id: string;
  designId: string;
  customer: { id?: string; name: string };
  shape: string;
  w?: number;
  h?: number;
  title?: string;
};
type Answer = {
  ok: boolean;
  error?: string;
  job?: Job;
  words?: Word[];
  sheet?: Sheet | null;
  sheetState?: "ready" | "pending" | "none" | "failed";
  sheetError?: string;
};

const WEIGHTS: FontWeightName[] = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "ultrabold",
  "heavy",
];
function weightName(w: number | string | undefined): FontWeightName {
  if (typeof w === "string") {
    const k = w.toLowerCase().replace(/[\s-]/g, "");
    const alias: Record<string, FontWeightName> = {
      regular: "normal",
      book: "normal",
      extrabold: "ultrabold",
      black: "heavy",
      demibold: "semibold",
      ultralight: "extralight",
    };
    if ((WEIGHTS as string[]).includes(k)) return k as FontWeightName;
    if (alias[k]) return alias[k];
    const n = parseInt(k, 10);
    if (!isNaN(n)) return weightName(n);
    return "normal";
  }
  const n = typeof w === "number" ? w : 400;
  return WEIGHTS[Math.max(0, Math.min(8, Math.round(n / 100) - 1))] || "normal";
}
function nearestWeight(font: Font, want: FontWeightName): FontWeightName {
  const have = font.weights.map((x) => x.weight);
  if (have.includes(want)) return want;
  const i = WEIGHTS.indexOf(want);
  let best = have[0] || "normal";
  let d = 99;
  have.forEach((h) => {
    const dd = Math.abs(WEIGHTS.indexOf(h) - i);
    if (dd < d) {
      d = dd;
      best = h;
    }
  });
  return best;
}
function hex6(c: string | undefined, fallback = "#000000"): string {
  const m = String(c || "")
    .trim()
    .match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return fallback;
  const g = m[1] || "000000";
  const h =
    g.length === 3
      ? g
          .split("")
          .map((x) => x + x)
          .join("")
      : g;
  return "#" + h.toLowerCase();
}
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const App = () => {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [err, setErr] = useState("");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [fonts, setFonts] = useState<Record<string, Font>>({});
  const [busy, setBusy] = useState<string>("");
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const polls = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  async function load(quiet = false) {
    if (!quiet) setState("loading");
    try {
      const [userToken, design, meta] = await Promise.all([
        auth.getCanvaUserToken(),
        getDesignToken(),
        getDesignMetadata().catch(() => null),
      ]);
      const d = meta && meta.defaultPageDimensions;
      if (d) setDims({ w: d.width, h: d.height });
      const r = await fetch(BACKEND + "/app/job", {
        headers: {
          Authorization: "Bearer " + userToken,
          "X-Design-Token": design.token,
        },
      });
      const j: Answer = await r.json().catch(() => ({
        ok: false,
        error: "ix-canva answered HTTP " + r.status,
      }));
      if (!r.ok || !j.ok) throw new Error(j.error || "HTTP " + r.status);
      setAnswer(j);
      setState("ready");
      if (j.sheetState === "pending" && polls.current < POLL_MAX) {
        polls.current += 1;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => load(true), POLL_MS);
      }
    } catch (e) {
      setErr((e as Error).message || String(e));
      setState("error");
    }
  }

  useEffect(() => {
    load();
    findFonts()
      .then((res) => {
        const m: Record<string, Font> = {};
        res.fonts.forEach((f) => {
          m[norm(f.name)] = f;
        });
        setFonts(m);
      })
      .catch(() => setFonts({}));
    return () => window.clearTimeout(timer.current);
  }, []);

  const job = answer && answer.job;
  const sheet = answer && answer.sheet;
  const W = (dims && dims.w) || (job && job.w) || 700;
  const H = (dims && dims.h) || (job && job.h) || 235;

  // the lines to place: the sheet's, else Ad Maker's words list
  const lines: Line[] =
    sheet && sheet.lines && sheet.lines.length
      ? sheet.lines
      : (answer && answer.words ? answer.words : []).map((w) => ({
          text: w.text,
          role: w.slot,
          font: w.font,
          weight: w.weight,
          sizePx: w.size,
          colour: w.colour,
        }));
  const srcW = (sheet && sheet.srcW) || W;
  const srcH = (sheet && sheet.srcH) || H;
  const sameShape =
    !!sheet &&
    Math.abs(srcW / srcH - W / H) / (W / H) <= SHAPE_TOLERANCE &&
    lines.every((l) => !!l.box);
  const scale = Math.min(W / srcW, H / srcH);

  function pickFont(l: Line): { font: Font | null; name: string } {
    const names = [l.font, ...(l.alts || [])].filter(Boolean) as string[];
    for (const n of names) {
      const f = fonts[norm(n)];
      if (f) return { font: f, name: f.name };
    }
    return { font: null, name: names[0] || "" };
  }
  function placement(l: Line, i: number) {
    const size = Math.max(
      6,
      Math.min(1000, Math.round((l.sizePx || 18) * (sameShape ? scale : 1))),
    );
    if (sameShape && l.box) {
      return {
        left: Math.round(l.box.x * W),
        top: Math.round(l.box.y * H),
        width: Math.max(20, Math.round(l.box.w * W)),
        size,
      };
    }
    let top = 12;
    for (let k = 0; k < i; k++)
      top += Math.round((lines[k]?.sizePx || 18) * 1.35) + 6;
    return { left: 12, top, width: Math.max(40, W - 24), size };
  }
  async function addLine(l: Line, i: number) {
    const { font } = pickFont(l);
    const p = placement(l, i);
    const fw = weightName(l.weight);
    await addElementAtPoint({
      type: "text",
      children: [l.text],
      top: p.top,
      left: p.left,
      width: p.width,
      fontSize: p.size,
      color: hex6(l.colour),
      textAlign: l.align || "start",
      fontRef: font ? (font.ref as FontRef) : undefined,
      fontWeight: font ? nearestWeight(font, fw) : fw,
    });
    setAdded((a) => ({ ...a, [i]: true }));
  }
  async function addOne(i: number) {
    setBusy("line" + i);
    try {
      const l = lines[i];
      if (l) await addLine(l, i);
    } catch (e) {
      setErr("Could not add the text: " + (e as Error).message);
    }
    setBusy("");
  }
  async function addAll() {
    setBusy("all");
    try {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l) await addLine(l, i);
      }
    } catch (e) {
      setErr("Could not add every line: " + (e as Error).message);
    }
    setBusy("");
  }

  if (state === "loading")
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <LoadingIndicator size="medium" />
          <Text alignment="center" size="small" tone="tertiary">
            Finding this design in inbxify
          </Text>
        </Rows>
      </div>
    );
  if (state === "error" || !job)
    return (
      <div className={styles.scrollContainer}>
        <Rows spacing="2u">
          <Title size="small">inbxify Ad Maker</Title>
          <Alert tone="critical">
            {err ||
              "This design was not opened from inbxify. Open it with Edit in Canva in the Ads tab."}
          </Alert>
          <Button variant="secondary" onClick={() => load()}>
            Try again
          </Button>
          <Text size="xsmall" tone="tertiary">
            v{APP_VERSION}
          </Text>
        </Rows>
      </div>
    );

  const colours: Colour[] =
    sheet && sheet.colours && sheet.colours.length
      ? sheet.colours
      : Array.from(
          new Set(lines.map((l) => hex6(l.colour, "")).filter(Boolean)),
        ).map((h) => ({ hex: h, where: "text" }));

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        <Rows spacing="0.5u">
          <Title size="small">{job.customer.name}</Title>
          <Text size="small" tone="tertiary">
            {job.shape} · {W} × {H}
            {sheet
              ? sameShape
                ? " · lines keep their places"
                : " · new shape: lines stack down the left"
              : ""}
          </Text>
        </Rows>

        {answer && answer.sheetState === "pending" ? (
          <Alert tone="info">
            Reading the fonts and colours off the original ad. This takes a few
            seconds; the words below are Ad Maker's list until then.
          </Alert>
        ) : null}
        {answer && answer.sheetState === "failed" ? (
          <Alert tone="warn">
            The fonts and colours could not be read ({answer.sheetError || "no reason"}).
            The words below are Ad Maker's list.
          </Alert>
        ) : null}
        {err ? <Alert tone="critical">{err}</Alert> : null}

        <Rows spacing="1u">
          <Text size="small" variant="bold">
            Colours in the ad
          </Text>
          {colours.length ? (
            colours.map((c, i) => (
              <Columns key={"c" + i} spacing="1u" alignY="center">
                <Column width="content">
                  <Swatch fill={[hex6(c.hex)]} tooltipLabel={hex6(c.hex)} />
                </Column>
                <Column>
                  <Text size="small">
                    <strong>{hex6(c.hex).toUpperCase()}</strong>
                    {c.where ? " · " + c.where : ""}
                  </Text>
                </Column>
              </Columns>
            ))
          ) : (
            <Text size="small" tone="tertiary">
              None read yet.
            </Text>
          )}
        </Rows>

        <Rows spacing="1u">
          <Columns spacing="1u" alignY="center">
            <Column>
              <Text size="small" variant="bold">
                The words
              </Text>
            </Column>
            <Column width="content">
              <Button
                variant="primary"
                onClick={addAll}
                loading={busy === "all"}
                disabled={!!busy || !lines.length}
              >
                Add all words
              </Button>
            </Column>
          </Columns>
          {lines.map((l, i) => {
            const f = pickFont(l);
            const p = placement(l, i);
            return (
              <Box
                key={"l" + i}
                padding="1.5u"
                borderRadius="standard"
                background="neutralLow"
              >
                <Rows spacing="1u">
                  <Text size="small">
                    <strong>{l.text}</strong>
                  </Text>
                  <Columns spacing="1u" alignY="center">
                    <Column width="content">
                      <Swatch fill={[hex6(l.colour)]} />
                    </Column>
                    <Column>
                      <Text size="xsmall" tone="tertiary">
                        {(f.name || "Font not read") +
                          " · " +
                          weightName(l.weight) +
                          " · " +
                          p.size +
                          " px · " +
                          hex6(l.colour).toUpperCase()}
                      </Text>
                    </Column>
                  </Columns>
                  {!f.font && f.name ? (
                    <Text size="xsmall" tone="tertiary">
                      {f.name} is not offered to apps: Add uses Canva's default;
                      pick {f.name} in the font menu.
                      {l.alts && l.alts.length
                        ? " Also close: " + l.alts.join(", ") + "."
                        : ""}
                    </Text>
                  ) : null}
                  <Columns spacing="1u" alignY="center">
                    <Column>
                      {l.role ? (
                        <Badge text={l.role} tone="assist" />
                      ) : null}
                    </Column>
                    <Column width="content">
                      <Button
                        variant="secondary"
                        onClick={() => addOne(i)}
                        loading={busy === "line" + i}
                        disabled={!!busy}
                      >
                        {added[i] ? "Add again" : "Add"}
                      </Button>
                    </Column>
                  </Columns>
                </Rows>
              </Box>
            );
          })}
        </Rows>

        <Columns spacing="1u" alignY="center">
          <Column>
            <Text size="xsmall" tone="tertiary">
              inbxify app v{APP_VERSION} · job {job.id}
            </Text>
          </Column>
          <Column width="content">
            <Button variant="tertiary" onClick={() => load()}>
              Refresh
            </Button>
          </Column>
        </Columns>
      </Rows>
    </div>
  );
};
