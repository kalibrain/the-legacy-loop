# Demo Mode Feature Plan

## Objective
Add an end-to-end automated demo mode for the Legacy Loop app with:
- Toggle 1: Demo mode `on/off`
- Toggle 2: Demo duration profile `3 min` or `10 min`

When demo mode is enabled, the app should auto-run the entire flow (source selection, configuration, collection, consent, interview, finish) using scripted answers.

## In-Scope Requirements
- Full flow automation from `/start` to `/finish`.
- Two demo profiles:
  - `3 min` profile: total run time target `2:00` to `2:30`.
  - `10 min` profile: total run time target `8:00` to `9:00`.
- Run `2 interview question-answer sequences` in 3-minute mode.
- Run `10 interview question-answer sequences` in 10-minute mode.
- Use browser-based prototype state (no production-grade persistence required).
- Support a predefined Q&A script provided by the team.

## Out of Scope (for this iteration)
- Perfect production hardening, comprehensive security controls, or backend orchestration changes.
- Multi-user synchronization or server-stored demo sessions.
- Replacing core app architecture.

## Proposed UX
- Add a `Demo Mode` panel at the bottom of `/start` with:
  - `Enable Demo Mode` switch.
  - `Demo Length` segmented control: `3 min` / `10 min` (active only when enabled).
  - `Run Demo` button (starts automation from beginning of flow).
- Demo controls reset each time `/start` is opened.

## Technical Design
### 1) State Model
- Extend flow state with demo config/status, e.g.:
  - `demo.enabled: boolean`
  - `demo.profile: "three-min" | "ten-min"`
  - `demo.running: boolean`
  - `demo.error?: string`
- Demo controls are reset on `/start` mount.

### 2) Demo Scenario Contract
- Script source: `src/lib/demo-script.json`.
- Contract:
  - `items[].id`
  - `items[].question`
  - `items[].answer`
  - optional `items[].follow_ups[]` with `id`, `question`, `answer`
- Runtime behavior:
  - 3-minute mode uses first 2 primary items.
  - 10-minute mode uses first 10 primary items.
  - Follow-ups are retained in script data for future extension.

### 3) Demo Runner
- Use page-level automation + shared helper utilities (`src/lib/demo-mode.ts`) that:
  - Navigates routes in sequence.
  - Applies source selections/config details through existing provider actions.
  - Triggers collection API call using existing flow path and profile timing.
  - Accepts consent automatically.
  - Submits scripted interview answers to existing interview APIs.
  - Uses one auto-retry attempt on failures, then stops for manual restart.
- Add guardrails:
  - Abort on API error and show actionable message.
  - Abort on route mismatch or missing state prerequisites.
  - Prevent duplicate parallel runs.

### 4) Timing Profiles
- Keep timing deterministic with small jitter to look natural.
- Suggested budget envelopes:
  - `3 min profile` (target 120-150s total):
    - Setup and source config: 25-35s
    - Mock collection and review: 25-35s
    - Interview 2 Q/A sequences: 40-60s
    - Finish transition: 5-10s
  - `10 min profile` (target 480-540s total):
    - Setup and source config: 45-60s
    - Mock collection and review: 35-50s
    - Interview 10 Q/A sequences: 360-420s
    - Finish transition: 10-15s

### 5) Interview Handling Strategy
- Keep current interview APIs in place for non-demo mode.
- Demo mode uses scripted/fallback prompts and scripted answers for reliability.
- Non-demo mode retains natural Maizey + U-M GPT behavior.

## Implementation Phases
1. Add demo state types + provider actions + persistence.
2. Build demo controls UI (toggles, run/stop, status).
3. Implement demo script schema and first script placeholders.
4. Implement runner orchestration for collect + interview + finish.
5. Calibrate timing for both profiles against runtime targets.
6. Add failure handling and restart behavior.
7. Add README section for demo mode usage.

## Acceptance Criteria
- Demo mode can be toggled on/off without breaking normal manual flow.
- Demo profile can be switched between `3 min` and `10 min`.
- Starting demo auto-runs complete flow without manual intervention.
- Both profiles complete within their required runtime windows.
- Exactly 2 Q/A sequences run in 3-minute mode.
- Exactly 10 Q/A sequences run in 10-minute mode.
- Failed automated API calls retry once, then stop for manual restart.

## Risks and Mitigations
- External API variability could break timing:
  - Mitigation: optional fallback/mock interview responses.
- User interaction during auto-run can create race conditions:
  - Mitigation: lock conflicting controls during demo run.
- Refresh mid-run can desync runner:
  - Mitigation: resume-safe status in localStorage + restart command.

## Finalized Decisions
1. Demo controls are placed at the bottom of `/start`.
2. Demo controls reset each time `/start` is opened.
3. Interview sequence counts:
   - 3-minute mode: 2 Q/A
   - 10-minute mode: 10 Q/A
4. Script format: JSON with question/answer entries and optional follow-ups.
5. Demo mode uses scripted fallback interview behavior; non-demo remains natural.
6. Auto-retry once, then stop and require manual restart.

## Deliverables for Next Build Step
- `planning.md` approved.
- Scripted Q&A JSON seeded in `src/lib/demo-script.json`.
- Demo mode implementation validated with lint/build.
