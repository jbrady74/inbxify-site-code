// inbxify · Ad Maker match sheet · Canva app (side panel)
// v0.1.1 (18 Nov 2026, Ad Maker Build S3) — LINES KEEP THEIR PLACES; LIGHT SWATCHES GET AN OUTLINE.
//   · A banner made from a banner stacked every line down the left. Two all-or-nothing tests did it: the original's
//     proportions had to be within 15 % of the design's, and every single line had to have a place. A print ad cut
//     a little wider or taller than 700 × 235, or one line read without a place, sent all of them to the stack.
//     Now each line with a place keeps it, mapped so the whole original fits inside the design (scaled by the
//     smaller of the two ratios, centred on the other axis); only a line read without a place goes down the left.
//     Lines stack only when the shape really changed (one side more than 1.6 times the other's ratio, e.g. a
//     banner made into a sidebar). The panel says which of the two it will do.
//   · A white or near-white swatch disappeared on the panel. Light swatches now sit in a thin outline.
//   HARDCODING: HC-P-CAPP1-3 is now SHAPE_RATIO_MAX 1.6 (was SHAPE_TOLERANCE 15 %); HC-P-CAPP1-4 LIGHT_SWATCH 0.82
//   (the lightness above which a swatch gets its outline).
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
// HC-P-CAPP1-2 POLL_MS 3 s × 40 while the sheet is being read; HC-P-CAPP1-3 SHAPE_RATIO_MAX 1.6 (when the design's
// proportions differ from the original ad's by more than this factor, lines stack down the left instead of keeping
// their places); HC-P-CAPP1-4 LIGHT_SWATCH 0.82.

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

const APP_VERSION = "0.1.1";
const BACKEND = BACKEND_HOST.replace(/\/+$/, "");
const POLL_MS = 3000;
const POLL_MAX = 40;
const SHAPE_RATIO_MAX = 1.6; // HC-P-CAPP1-3
const LIGHT_SWATCH = 0.82; // HC-P-CAPP1-4

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
function isLight(c: string | undefined): boolean {
  const h = hex6(c);
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b >= LIGHT_SWATCH;
}
// a swatch that would vanish on the panel (white, cream) sits in a thin outline
function OutlinedSwatch(props: { colour: string | undefined; tip?: boolean }) {
  const h = hex6(props.colour);
  const sw = <Swatch fill={[h]} tooltipLabel={props.tip ? h : undefined} />;
  if (!isLight(h)) return sw;
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: "50%",
        boxShadow: "0 0 0 1px var(--ui-kit-color-control-strong-border, var(--ui-kit-color-ui-border))",
      }}
    >
      {sw}
    </div>
  );
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
  // v0.1.1: the original fits inside the design (the smaller ratio scales it, the other axis is centred), so a line
  // with a place keeps it even when the print ad was a little wider or taller than the design.
  const ratio = srcW / srcH / (W / H);
  const sameShape =
    !!sheet && ratio <= SHAPE_RATIO_MAX && ratio >= 1 / SHAPE_RATIO_MAX;
  const scale = Math.min(W / srcW, H / srcH);
  const offX = (W - srcW * scale) / 2;
  const offY = (H - srcH * scale) / 2;
  const placed = lines.filter((l) => sameShape && !!l.box).length;

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
      const left = Math.round(offX + l.box.x * srcW * scale);
      const top = Math.round(offY + l.box.y * srcH * scale);
      return {
        left: Math.max(0, Math.min(W - 20, left)),
        top: Math.max(0, Math.min(H - 6, top)),
        width: Math.max(20, Math.min(W, Math.round(l.box.w * srcW * scale))),
        size,
      };
    }
    // no place read for this line (or the shape changed): down the left, under the lines stacked before it
    let top = 12;
    for (let k = 0; k < i; k++) {
      const lk = lines[k];
      if (lk && !(sameShape && lk.box))
        top += Math.round((lk.sizePx || 18) * (sameShape ? scale : 1) * 1.35) + 6;
    }
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
                ? placed === lines.length
                  ? " · lines keep their places"
                  : " · " +
                    placed +
                    " of " +
                    lines.length +
                    " lines keep their places; the rest go down the left"
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
                  <OutlinedSwatch colour={c.hex} tip />
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
                      <OutlinedSwatch colour={l.colour} />
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
