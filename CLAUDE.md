# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Arc ("built on AtlasFlow") is a **clickable, static front-end prototype** for a clinical-education scheduling readiness tool. There is no build system, package manager, backend, database, or test suite — the entire app is hand-written HTML/CSS/JS meant to be opened directly in a browser or deployed as static files.

`README.txt` (the deploy note for the root app) says it all:
> Open index.html locally or deploy this entire folder. Keep the assets folder beside index.html.

There is no `npm install`, no build step, no lint command, and no test runner in this repo. To "run" the app, just open `index.html` in a browser (or serve the directory with any static file server). To "test" a change, open the file and click through the UI manually — there is no automated verification.

## Working rules

Arc is a **stakeholder-facing clickable prototype**. Treat every change as something a stakeholder may see mid-demo:

- Preserve the current visual design and primary demo flow unless explicitly instructed otherwise.
- Do not delete, rename, restructure, or consolidate files solely because they appear unused. Before removing any code or asset, verify it is not used by the live `index.html`, a deployed path, or a demo interaction — "looks unused" is not sufficient (see "Known dead/orphaned code" below for things that look unused but should still only be removed when asked).
- Make one focused change at a time. Do not modify unrelated features while addressing a specific request.
- Explain the proposed approach and the files that will be affected *before* editing.
- After every change, manually verify the primary workflow in the browser (open `index.html` and click through Capture → Attention Queue → Decision → Execute/Publish, per the flow described below) — not just the specific element touched.
- When reporting back, state exactly what changed, what was manually tested, and any remaining risk.
- Do not commit or push unless explicitly asked.

## Repository layout

```
index.html                          the live/current app — single 4,000+ line HTML file
assets/                              images used by index.html (only arc-header-logo.png is actually referenced)
assignments.js                       orphaned Vercel serverless function (Airtable proxy) — NOT called from index.html
atlasflow-align-prototype-main/      an earlier, separate, self-contained prototype (unrelated codebase, not imported by root index.html)
  ├── index.html                     its own full app, same pattern as root index.html but smaller/older
  └── api/assignments.js             duplicate of the root assignments.js
arc-operator-model.webp, arc-wordmark.webp   unused images at repo root (also duplicated under assets/)
```

**`index.html` at the repo root is the one real, current app.** The `atlasflow-align-prototype-main/` folder is a separate, older prototype kept for reference — do not assume the two share code or need to be kept in sync when editing one.

Git history is entirely "Add files via upload" commits (built by uploading through the GitHub web UI, not a normal local dev workflow) — don't expect meaningful commit messages when using `git blame`/`git log` for context.

## Architecture of `index.html`

Everything — styles, markup generation, state, routing, and event handling — lives inside this one file. There is no component framework (no React/Vue/etc.) and no virtual DOM.

- **State**: a single global `ST` object (defined near the top of the main `<script>` block) holds all app data and UI state — current view, open drawers/overlays, in-progress demo-flow progress, role (leader/student/hospital), etc. All app data is synthetic and generated in-memory by `seed()` — nothing persists to a backend. Only the current view name persists, via `localStorage['arc:view']` and `location.hash`.
- **Rendering**: `render()` rebuilds `#app`'s `innerHTML` from scratch on every state change by concatenating strings returned from per-view functions (`viewCapture`, `viewAssignments`, `viewChecks`, `viewRequests`, `viewCalendar`, `viewSites`, `viewStudents`, `viewTimeline`, `viewCalendar2`, `viewOperatingView`, etc.). There is no diffing — always full re-render.
- **Routing**: a `VIEWS` map keys view names (`overview`, `capture`, `assignments`, `checks`, `requests`, `calendar`, `calendar2`, `timeline`, `sites`, `students`, ...) to their view-render functions. Navigation updates `ST.view` and calls `render()`.
  - Note: `startArc()` (the init function run on page load) unconditionally forces `ST.view='overview'` on first load, regardless of the saved hash/localStorage value — persistence only kicks in afterward via the `hashchange` listener. Don't assume the README's "current page is persisted" claim applies to the initial load.
- **Events**: a single delegated `document.addEventListener('click', ...)` handler dispatches on a `data-act` attribute (`data-act="goto"`, `data-act="open"`, `data-act="queuesubmit"`, etc.) — there are 40+ branches in this one handler. When adding a new interactive element, add a new `data-act` value and a corresponding branch here rather than inventing a new event-wiring pattern.
- **HTML escaping**: user/data-derived strings must be passed through the `esc()` helper before being concatenated into template strings — this codebase has no framework-level auto-escaping, so every new string-interpolation site is a potential XSS vector if `esc()` is skipped.
- **Icons**: inline SVG paths are stored in the `P` object and rendered via the `ic(name, size, color, sw)` helper — there's no icon library/import.
- **Demo scenarios**: the guided workflow is scripted around three named seeded students/scenarios in `demoFlow()` (Priya Shah's rotation move, Daniel Brooks's level mismatch, Marcus Hill's DNP-day reconciliation). These IDs (`s5`/`a5`, `a4`, `a2`, etc.) are hardcoded throughout the view functions — if you change the seed data, check for hardcoded references to these specific IDs.

### Primary workflow / nav structure

The left nav (`nav()` function) is grouped into:
- **Primary workflow**: Operating View → Change Requests → Assignment Readiness → Assignment Timeline → Coverage Calendar → Clinical Sites
- **Reference data**: Students

`Capture` (the scripted "turn raw text into a structured request" demo) is no longer a nav-rail item — it stays reachable via its own replay control (`captureplay`) and the `capture` view key still exists in `VIEWS`, it's just not linked from the rail.

The storyline the prototype demonstrates: **Request → Evidence → Decision → Downstream readiness result**. Concretely: capture/submit a schedule-change request → run automated readiness checks (time-off conflicts, school calendar conflicts, level/specialty mismatch, site capacity, missing data — see `generateChecks()` and `CHECK_TYPES`) → triage in the **Attention Queue** (the prioritized worklist) → selecting a queue item opens the **Decision Workspace** (evidence, available choices, committed decision) → decide (Approve / Deny / Clarify / Escalate) → execute (confirm/reassign/notify) → publish.

Attention Queue and Decision Workspace are not separate nav routes — they are the two side-by-side panels of the single `overview` view (`viewOperatingView()`): Decision Workspace is the main panel (request summary → evidence → recommendation → decision), Attention Queue is the aside panel (the prioritized list of items). Do not assume they're independently routable without re-checking `VIEWS`.

Terminology note: `checks` (Readiness checks) and `calendar` (School calendar blocks, distinct from the `calendar2` Coverage Calendar view) are still fully wired in `VIEWS` but intentionally not in the nav rail — reachable only via drill-down links (KPI cards, readiness-issue links). Leave them as-is unless a task specifically asks you to address them.

There's also a role switcher (`ST.role`: `leader` / `student` / `hospital`) that swaps the whole shell between the leader dashboard, a student portal view, and a hospital feed view.

## Known dead/orphaned code

Be aware of these when doing cleanup or when confused about why something doesn't seem to be wired up — they are leftovers, not bugs to "fix" by wiring them in unless explicitly asked:

- `assignments.js` (root and the copy in `atlasflow-align-prototype-main/api/`) is a Vercel serverless function that proxies Airtable. Nothing in either `index.html` calls it — no `fetch`, no reference to Airtable anywhere in the front end.
- The `#arc-ov-v4-styles` `<style>` block targets `body.arc-ov-v4`, a class that is only ever removed (never added) in `render()` — this entire style block is unreachable dead CSS from a prior UI version.
- `arc-operator-model.webp` and `arc-wordmark.webp` at the repo root (and their duplicates under `assets/`) are not referenced by either `index.html`. Only `assets/arc-header-logo.png` is actually used.
- Multiple duplicate `vercel.live` feedback `<script>` tags near the end of `index.html`, each with a different `deployment-id` — accumulated from repeated Vercel preview deploys.
