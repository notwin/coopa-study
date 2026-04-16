# Changelog

All notable changes to Coopa Study.

## [0.1.0] – 2026-04-16 · Initial MVP

**Who this is for**: 11–14-year-old Chinese learners who want to play Google AI Quests in their native language.

### Added
- **In-place localization of Google AI Quests** via MV3 `declarativeNetRequest`:
  - Homepage, map page, and global UI fully translated (buttons, modals, footer, menus)
  - Cinematic WebVTT subtitles translated for Skye's intro monologue (20 cues) and Luna's Market Marshes opening (10 cues)
  - Token names and inventory labels for the Flood Forecasting quest
- **Right-side companion sidebar** (Preact in Shadow DOM):
  - Collapsible handle (32 px strip → 360 px panel)
  - 3 block types: `explainer`, `term` (flip card), `tip`
  - Chapter tabs for the Flood Forecasting quest
  - localStorage-persisted collapse preference
- **Build tooling**:
  - `scripts/fetch-cms.mjs` — pulls latest English source from Google CMS
  - `scripts/verify-shape.mjs` — CI-style parity check between English source and Chinese translation
  - `scripts/build-rules.mjs` — auto-generates MV3 declarativeNetRequest rules from `public/content-zh/`
  - `scripts/build-icons.mjs` — SVG → PNG icon and promo-image pipeline

### Coverage
- ✅ Flood Forecasting — intro, tokens, general UI
- ⏳ Blindness Prevention — English (placeholder, V0.2)
- ⏳ Mapping the Brain — not yet released by Google
- ⏳ Flood Forecasting later stages (data cleaning, model training, testing, complete/recap) — English (progressive translation in future patches)

### Known limitations
- Sidebar SPA-route visibility uses history monkey-patch in isolated world — effective only because users rarely navigate out of `/ai-quests/*` within a session. (Targeted fix in V0.2.)
- `verify-shape.mjs` skips files that are intentionally untranslated (`blindness_prevention.json`).

### Not included
- No TTS / pinyin
- No LLM-backed explanations
- No progress persistence
- No third-party analytics, tracking, or data collection of any kind
