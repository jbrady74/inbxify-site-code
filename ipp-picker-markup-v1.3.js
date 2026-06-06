/* ============================================================
   ipp-picker-markup-v1.3.js
   CHANGELOG
     v1.3 (from v1.2): rebuilt strings as TEMPLATE LITERALS spanning
       real newlines (was two giant single-line JSON strings, which
       broke copy/paste — only the last line copied). Functionally
       identical; now human-readable and copy-safe.
     v1.2: removed orphaned PHOTO GALLERY comment.
     v1.1: CC items use ipp-on / ipp-locked.
     v1.0: initial.
   Markup strings for the Picker module (keeps the page Embed small).
   ============================================================ */
window.IPP_PICKER_CC_MARKUP = `<h4>Content Controller</h4>
<div class="ipp-cc-list">
  <div class="ipp-cc-item ipp-on ipp-locked" data-section="greeting"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Greeting</div><span class="ipp-cc-count">Set</span></div>
  <div class="ipp-cc-item ipp-on ipp-locked" data-section="articles"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Articles</div><span class="ipp-cc-count">4 items</span></div>
  <div class="ipp-cc-item ipp-on ipp-locked" data-section="ads"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Ads</div><span class="ipp-cc-count">13 items</span></div>
  <div class="ipp-cc-item" data-section="lbp"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Local Business Profile</div></div>
  <div class="ipp-cc-item" data-section="txa"><div class="ipp-cc-box"></div><div class="ipp-cc-label">The Find (TXA)</div></div>
  <div class="ipp-cc-item" data-section="re"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Real Estate</div></div>
  <div class="ipp-cc-item" data-section="events"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Events</div></div>
</div>`;

window.IPP_PICKER_CANVAS_MARKUP = `

      <!-- ─── GREETING (first section, top of canvas) ─────────
           Two char-limited fields: Title (30) + Message (140). -->
      <section class="ipp-cat-section ipp-cat-greeting" id="ippCatGreeting">
        <div class="ipp-cat-head">
          <h5>Greeting</h5>
          <button type="button" class="ipp-ai-generate-btn" id="ipp_greetingGenerate" aria-label="Generate greeting with AI">
            <svg class="ipp-ai-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5z"/><path d="M19.5 15.5l.8 2.6 2.7.4-2.4.9-.5 2.6-1-2.5-2.7-.4 2.4-.9z" opacity=".65"/></svg>
            <span class="ipp-btn-label">AI Generate</span>
          </button>
          <button type="button" class="ipp-ai-undo-btn" id="ipp_greetingUndo" hidden aria-label="Undo AI generation">
            <svg class="ipp-undo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
            <span>Undo</span>
          </button>
          <span class="ipp-ct"><span class="ipp-muted">Opening message at the top of every issue</span></span>
        </div>
        <div class="ipp-greeting-row">
          <div class="ipp-greeting-field" data-ai="false">
            <label class="ipp-greeting-label" for="greetingTitle">Title <span class="ipp-char-limit">30 chars</span>
              <span class="ipp-ai-badge" id="ipp_greetTitleAiBadge" hidden>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5z"/></svg>
                AI
              </span>
            </label>
            <input type="text" class="ipp-greeting-input" id="ipp_greetingTitle" maxlength="30" value="Welcome back, Wyckoff!" placeholder="Issue greeting title" />
            <div class="ipp-char-count"><span id="ipp_greetTitleCount">22</span>/30</div>
          </div>
          <div class="ipp-greeting-field" data-ai="false">
            <label class="ipp-greeting-label" for="greetingMsg">Message <span class="ipp-char-limit">140 chars</span>
              <span class="ipp-ai-badge" id="ipp_greetMsgAiBadge" hidden>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5z"/></svg>
                AI
              </span>
            </label>
            <textarea class="ipp-greeting-input ipp-greeting-msg" id="ipp_greetingMsg" maxlength="140" rows="2" placeholder="A short opening line for the issue">Here's what's open this weekend, plus a new listing on Hill Rd and the spring sports preview.</textarea>
            <div class="ipp-char-count"><span id="ipp_greetMsgCount">92</span>/140</div>
          </div>
        </div>
      </section>

      <section class="ipp-cat-section ipp-cat-articles" id="ippCatArticles">
        <div class="ipp-cat-head">
          <h5>Articles</h5>
          <span class="ipp-ct"><b id="ipp_artFilled">3</b> of <span id="ipp_artTotal">4</span> assigned · <span class="ipp-muted">add or remove freely</span></span>
        </div>
        <div class="ipp-cat-tiles" id="ipp_artTiles">

          <div class="ipp-ctile filled" data-i="0">
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Spring on Main Street</div>
            <div class="ipp-tmeta">M. Reilly · 950 wd</div>
          </div>

          <div class="ipp-ctile filled" data-i="1">
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">New Library Hours</div>
            <div class="ipp-tmeta">600 wd</div>
          </div>

          <div class="ipp-ctile ghost" data-i="2">
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ghost-line long"></div>
            <div class="ipp-ghost-line short"></div>
            <div class="ipp-tmeta">Tap to assign article</div>
          </div>

          <div class="ipp-ctile filled" data-i="3">
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Spring Sports Preview</div>
            <div class="ipp-tmeta">450 wd</div>
          </div>

          <div class="ipp-ctile filled" data-i="4" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Hill Rd: Bergen's Quietest Mile</div>
            <div class="ipp-tmeta">K. Singh · 720 wd</div>
          </div>

          <div class="ipp-ctile ghost" data-i="5" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ghost-line long"></div>
            <div class="ipp-ghost-line short"></div>
            <div class="ipp-tmeta">Tap to assign article</div>
          </div>

          <div class="ipp-ctile filled" data-i="6" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Wyckoff's New Dog Park</div>
            <div class="ipp-tmeta">380 wd</div>
          </div>

          <div class="ipp-ctile filled" data-i="7" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Memorial Day Reflections</div>
            <div class="ipp-tmeta">Editor · 250 wd</div>
          </div>

          <div class="ipp-ctile ghost" data-i="8" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ghost-line long"></div>
            <div class="ipp-ghost-line short"></div>
            <div class="ipp-tmeta">Tap to assign article</div>
          </div>

          <div class="ipp-ctile filled" data-i="9" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Restaurant Week Returns</div>
            <div class="ipp-tmeta">520 wd</div>
          </div>

          <div class="ipp-ctile filled" data-i="10" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">HS Honors Concert</div>
            <div class="ipp-tmeta">340 wd</div>
          </div>

          <div class="ipp-ctile filled" data-i="11" hidden>
            <button type="button" class="ipp-del-btn" aria-label="Remove this slot">&times;</button>
            <div class="ipp-ghost-img"></div>
            <div class="ipp-ttitle">Council Meeting Highlights</div>
            <div class="ipp-tmeta">410 wd</div>
          </div>

          <!-- + Add tile (always last; flows to next slot position) -->
          <button type="button" class="ipp-ctile add" id="ipp_artAdd" aria-label="Add another article slot">
            <span class="ipp-add-circle">+</span>
            <span class="ipp-add-lbl">Add article</span>
          </button>

        </div>
      </section>

      <!-- ─── ADS ──────────────────────────────────────────────── -->
      <section class="ipp-cat-section ipp-cat-ads" id="ippCatAds">
        <div class="ipp-cat-head">
          <h5>Ads</h5>
          <span class="ipp-ct">1 splash · <b id="ipp_bnrFilled">9</b> of <span id="ipp_bnrTotal">12</span> banners assigned · <span class="ipp-muted">add or remove freely</span></span>
        </div>

        <div class="ipp-ad-row">

          <!-- SPLASH AD COLUMN -->
          <div class="ipp-splash-col">
            <div class="ipp-ad-label">Splash Ad</div>
            <div class="ipp-splash-wrap">
              <div class="ipp-splash-tile" id="ipp_splashTile">
                <button type="button" class="ipp-del-btn" aria-label="Clear splash">&times;</button>
                <div class="ipp-splash-img"></div>
                <button type="button" class="ipp-splash-customer"><span class="ipp-name">Wyckoff Wellness Group</span><span class="ipp-chev">▾</span></button>
              </div>
            </div>
          </div>

          <!-- BANNER ADS COLUMN -->
          <div class="ipp-banner-col">
            <div class="ipp-ad-label">Banner Ads</div>
            <div class="ipp-banner-grid" id="ipp_bnrTiles">

              <div class="ipp-banner-tile lead">
                <span class="ipp-lead-badge">LEAD</span>
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Bergen Heating</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img ar-700x300"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Brook Tavern · 700×300</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Wyckoff Dental</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile ghost">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Unassigned</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Bergen Auto Service</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Vista Vision Care</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Premier Realty NJ</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Bergen YMCA</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile ghost">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Unassigned</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Furry Friends Grooming</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Bergen Community Bank</span><span class="ipp-chev">▾</span></button>
              </div>

              <div class="ipp-banner-tile ghost">
                <button type="button" class="ipp-del-btn" aria-label="Remove banner">&times;</button>
                <div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>
                <button type="button" class="ipp-banner-customer"><span class="ipp-name">Unassigned</span><span class="ipp-chev">▾</span></button>
              </div>

            </div>
          </div>
        </div>

        <!-- + Add banner bar (full canvas width, below the row) -->
        <button type="button" class="ipp-banner-add-bar" id="ipp_bnrAdd">
          <span class="ipp-add-circle">+</span>
          <span>Add banner</span>
        </button>
      </section>

      <!-- ─── LOCAL BUSINESS PROFILE (LBP) ────────────────────
           Splash-like portrait tile. Profile image fills the body,
           logo + customer picker share a footer row. Default 1 per issue. -->
      <section class="ipp-cat-section ipp-cat-lbp" id="ippCatLBP" hidden>
        <div class="ipp-cat-head">
          <h5>Local Business Profile</h5>
          <span class="ipp-ct"><b id="lbpFilled">1</b> of <span id="lbpTotal">1</span> profiles · <span class="ipp-muted">add or remove freely</span></span>
        </div>
        <div class="ipp-lbp-row" id="ipp_lbpTiles">

          <div class="ipp-lbp-wrap">
            <div class="ipp-lbp-tile">
              <button type="button" class="ipp-del-btn" aria-label="Remove profile">&times;</button>
              <div class="lbp-profile-img"></div>
              <div class="lbp-foot">
                <div class="lbp-logo"></div>
                <button type="button" class="ipp-lbp-customer">
                  <span class="ipp-name">Wyckoff Wellness Group</span>
                  <span class="ipp-chev">▾</span>
                </button>
              </div>
            </div>
          </div>

          <button type="button" class="ipp-lbp-add" id="lbpAdd" aria-label="Add another profile">
            <span class="ipp-add-circle">+</span>
            <span class="ipp-add-lbl">Add profile</span>
          </button>

        </div>
      </section>

      <!-- ─── THE FIND (TXA) ──────────────────────────────────
           Compact 5-up grid. Each tile: circular logo + customer picker. -->
      <section class="ipp-cat-section ipp-cat-txa" id="ippCatTXA" hidden>
        <div class="ipp-cat-head">
          <h5>The Find (TXA)</h5>
          <button type="button" class="txa-category" id="txaCategory">
            <span class="cat-prefix">Category:</span>
            <span class="cat-value">Local Retail</span>
            <span class="ipp-chev">▾</span>
          </button>
          <span class="ipp-ct"><b id="txaFilled">3</b> of <span id="txaTotal">5</span> tiles assigned · <span class="ipp-muted">add or remove freely</span></span>
        </div>
        <div class="txa-grid" id="ipp_txaTiles">

          <div class="ipp-txa-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove tile">&times;</button>
            <div class="txa-logo"></div>
            <button type="button" class="txa-customer">
              <span class="ipp-name">Brook Tavern</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-txa-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove tile">&times;</button>
            <div class="txa-logo"></div>
            <button type="button" class="txa-customer">
              <span class="ipp-name">Bergen Heating</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-txa-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove tile">&times;</button>
            <div class="txa-logo"></div>
            <button type="button" class="txa-customer">
              <span class="ipp-name">Wyckoff Dental</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-txa-tile ghost">
            <button type="button" class="ipp-del-btn" aria-label="Remove tile">&times;</button>
            <div class="txa-logo"></div>
            <button type="button" class="txa-customer">
              <span class="ipp-name">Tap to assign</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-txa-tile ghost">
            <button type="button" class="ipp-del-btn" aria-label="Remove tile">&times;</button>
            <div class="txa-logo"></div>
            <button type="button" class="txa-customer">
              <span class="ipp-name">Tap to assign</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <button type="button" class="txa-add" id="txaAdd" aria-label="Add another tile">
            <span class="ipp-add-circle">+</span>
            <span class="ipp-add-lbl">Add tile</span>
          </button>

        </div>
      </section>

      <!-- ─── REAL ESTATE ─────────────────────────────────────
           Industry-standard 4:3 image aspect (1280×960 / 1024×768).
           Tile matches article height; image at top, address below. -->
      <section class="ipp-cat-section ipp-cat-re" id="ippCatRE" hidden>
        <div class="ipp-cat-head">
          <h5>Real Estate</h5>
          <span class="ipp-ct"><b id="reFilled">3</b> of <span id="reTotal">4</span> listings assigned · <span class="ipp-muted">add or remove freely</span></span>
        </div>
        <div class="re-grid" id="ipp_reTiles">

          <div class="ipp-re-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove listing">&times;</button>
            <div class="ipp-re-img"></div>
            <button type="button" class="ipp-re-address">
              <span class="ipp-name">14 Maple Avenue</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-re-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove listing">&times;</button>
            <div class="ipp-re-img"></div>
            <button type="button" class="ipp-re-address">
              <span class="ipp-name">87 Oak Street</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-re-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove listing">&times;</button>
            <div class="ipp-re-img"></div>
            <button type="button" class="ipp-re-address">
              <span class="ipp-name">23 Pine Lane</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <div class="ipp-re-tile ghost">
            <button type="button" class="ipp-del-btn" aria-label="Remove listing">&times;</button>
            <div class="ipp-re-img"></div>
            <button type="button" class="ipp-re-address">
              <span class="ipp-name">Tap to assign</span>
              <span class="ipp-chev">▾</span>
            </button>
          </div>

          <button type="button" class="ipp-re-add" id="ipp_reAdd" aria-label="Add another listing">
            <span class="ipp-add-circle">+</span>
            <span class="ipp-add-lbl">Add listing</span>
          </button>

        </div>
      </section>

      <!-- ─── EVENTS ──────────────────────────────────────────
           Image envelope: 110px fixed height, variable width.
           Demo tiles show different native aspects letterboxed. -->
      <section class="ipp-cat-section ipp-cat-events" id="ippCatEvents" hidden>
        <div class="ipp-cat-head">
          <h5>Events</h5>
          <span class="ipp-ct"><b id="evFilled">3</b> of <span id="evTotal">4</span> events assigned · <span class="ipp-muted">add or remove freely</span></span>
        </div>
        <div class="event-grid" id="evTiles">

          <div class="event-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove event">&times;</button>
            <div class="event-img-frame"><div class="event-img"></div></div>
            <button type="button" class="event-name">
              <span class="ipp-name">Spring Festival</span>
              <span class="ipp-chev">▾</span>
            </button>
            <div class="event-meta">May 30 · 12 PM · Wyckoff Park</div>
          </div>

          <div class="event-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove event">&times;</button>
            <div class="event-img-frame"><div class="event-img ar-1-1"></div></div>
            <button type="button" class="event-name">
              <span class="ipp-name">Memorial Parade</span>
              <span class="ipp-chev">▾</span>
            </button>
            <div class="event-meta">May 27 · 10 AM · Main St</div>
          </div>

          <div class="event-tile">
            <button type="button" class="ipp-del-btn" aria-label="Remove event">&times;</button>
            <div class="event-img-frame"><div class="event-img ar-4-5"></div></div>
            <button type="button" class="event-name">
              <span class="ipp-name">Concert in the Park</span>
              <span class="ipp-chev">▾</span>
            </button>
            <div class="event-meta">Jun 5 · 7 PM · Boyd Park</div>
          </div>

          <div class="event-tile ghost">
            <button type="button" class="ipp-del-btn" aria-label="Remove event">&times;</button>
            <div class="event-img-frame"><div class="event-img"></div></div>
            <button type="button" class="event-name">
              <span class="ipp-name">Tap to assign</span>
              <span class="ipp-chev">▾</span>
            </button>
            <div class="event-meta">Unassigned</div>
          </div>

          <button type="button" class="event-add" id="evAdd" aria-label="Add another event">
            <span class="ipp-add-circle">+</span>
            <span class="ipp-add-lbl">Add event</span>
          </button>

        </div>
      </section>
      `;
