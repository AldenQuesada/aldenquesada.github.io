# Bio analytics v1

## Boundaries

The public page's CSS, content JSON, renderer, assets, UTM propagation and carousel code are unchanged. Only the root page replaces the old tracker. Mentoria/conferencias/quiz/TSL keep their previous collectors. Do not claim cross-funnel continuity until those collectors are migrated.

Browser collection: `js/analytics/config.js` (rules), `core.js` (session identity, queue and transport), `bio.js` (passive DOM observer). Backend: versioned `supabase/migrations/`; private sites, viewers, sessions, pages and events; constrained public RPCs. Dashboard: `test-insomnio/painel/bio/`, using the existing owner login and modular Studio auth, request, rendering and formatting adapters. Metric formulas are in the database, not duplicated in charts.

## Measurement contract

- A session is a random identifier retained on the same origin for 30 minutes after activity. Tabs can share it; every loaded document gets its own page ID. This is a session count, not an identified-person count. Storage restrictions can break continuity.
- Each event has a stable UUID. Retry removes events only after the server acknowledges the whole batch. Queue is capped at 120 events, 20 per request, expires after 23 hours. Browser closure can still lose unsent data. `BioAnalytics.diagnostics()` reports local pending/failure/drop counts; no network delivery is guaranteed.
- Active time counts only a visible tab, capped at 30 seconds since a touch/key/scroll or visibility return. Sampling is conservative at 1 second; performance stalls are not counted as reading. Sum heartbeat increments once per event, then median across sessions with a page view in the selected period. Missing time is null, never zero.
- Exposure needs 50% of card height (or screen height for a tall card) visible for 1 second of activity. Card and slide exposures count once per page. Autoplay is never an engagement event. Clicks record the active slide and whether the slide transition is in progress. All event hooks are passive and never call preventDefault or change links/styles/content.
- A card's click-through rate is sessions with both exposure and click divided by sessions exposed. Total click count includes repeated clicks and clicks occurring before exposure qualifies. Footer social links currently have clicks but no exposure denominator.
- Days and hours use America/Sao_Paulo. Comparisons use an equal elapsed portion of the previous period; current day is incomplete. Maximum report range: 90 days. Configurable minimum sample 30 exposures is a descriptive caution, not statistical significance.
- Historical bio_view/bio_click/bio_bloco remain in quiz_events; report reads them without mutation. Historical session IDs are namespaced, so they cannot collide with v1 IDs. Legacy exposure uses a different definition; old duration is not included in active-time calculations. The report labels those limitations.

## Privacy and access

No ad pixel/SDK, fingerprint, IP address, raw user-agent, complete referrer/destination URL, message body, quiz result or health answer is stored in the new schema. It stores an allowlisted card ID, coarse browser/device, language, campaign fields and referrer host. The collector respects DNT, GPC, `instituto_analytics_optout=1` in localStorage and `?medicao=off`. It is not an advertising-consent manager. Review consent requirements before enabling future ad integrations.

All module tables have RLS and no anon/authenticated table privileges. Anonymous access can only submit bounded, validated events. Dashboard access additionally checks a private viewer allowlist seeded with the existing verified owner account; future signups do not gain access. Public wrappers are security-invoker. Privileged implementations have an empty search_path and explicit grants. Session request caps reduce accidental floods, but cannot authenticate public visitors or defeat determined bot spoofing; an edge gateway/WAF is a future hardening step if traffic warrants it.

Raw v1 events retained 180 days; daily maintenance uses pg_cron where available. No legacy/quiz/CRM rows are deleted. Changing the retention policy requires an explicit reviewed migration. Backups contain pseudonymous analytics and viewer IDs and must remain outside Git and GitHub Pages. The existing external backup does not automatically cover the private schema; use the module backup tool. Local automated backup scheduling is still an operations follow-up.

## Local verification

Run `sh ferramentas/analytics-local.sh start` with PostgreSQL 16 installed; `ANALYTICS_PG_BIN` can select its bin directory. Data stays under ignored `.local/analytics/`. Stop with `sh ferramentas/analytics-local.sh stop`. Use this disposable PostgreSQL instance on 127.0.0.1:55439, database postgres. Initialize UTF-8 and load `tests/bootstrap.sql`, then all migrations in order. Bootstrap uses a synthetic owner and minimal Supabase roles; never load it in production. The full Supabase Docker stack is not required for these SQL contract tests.

```
node tests/analytics-core.cjs
node tests/bio-observer.cjs
python3 tests/database.py
python3 tests/studio-database.py
```

`database.py` is fixed to localhost:55439. It tests idempotence, ownership, invalid payloads, private read restrictions, dashboard permissions, metric math, metadata exclusion and null metrics. Also inspect the page in a browser at desktop and mobile widths. Default localhost collection is off; `?medicao=test&interno=1` is for a local endpoint only. Never point a local preview at production.

## Deployment, backup and rollback

Use `ferramentas/analytics-db.py migrate --project <ref> --keychain <existing-service>` (or an in-memory SUPABASE_ACCESS_TOKEN). It applies migrations through the official Management API and adopts the returned version for CLI consistency. It skips already-recorded migration names; never edit a deployed migration. Public clients retain only the existing anon key. Deploy database before switching the root HTML and before publishing the dashboard.

`ferramentas/analytics-db.py backup --project <ref> --output <new-private-directory> --keychain <existing-service>` creates a single-snapshot JSON export plus complete versioned schema. It includes only this analytics aggregate, not clinical/quiz/Auth credentials. Beyond 100,000 events use pg_dump. Restore into an isolated database: apply schema after the appropriate auth-role prerequisites, then load sites/viewers/sessions/pages/events in dependency order with jsonb_populate_recordset, preserving UUIDs. Verify counts, grants, constraints and aggregate results. Viewer identities must match the target Auth database.

Rollback: restore the original root HTML script references to resume legacy tracking; the renderer and CSS never changed. Keep the new database and event history intact, disable `analytics_private.sites.enabled` for bio if needed. Remove the panel link if rolling back its UI. Disable only the named bio-analytics-retention job if reverting maintenance; never drop unrelated schemas/extensions. No changes to quiz state, CRM, clinical records or payment integrations belong to this release.

## Instituto Studio — stage 1 (2026-10-15)

The premium panel unifies overview, visual funnels, analysis and data health at `test-insomnio/painel/bio/`. The previous `/painel/` entry redirects to the insomnia tab. Light/dark themes and responsive layouts affect only the authenticated panel. Public bio content, CSS, carousels, collectors, quiz and TSL assets remain unchanged in this stage. Hotmart, the page builder and cross-page journey correlation remain deferred.

`public.analytics_studio_report` is a security-invoker wrapper around a viewer-checked private read model. The bio adapter delegates the existing report and adds recent activity from v1 events; the insomnia adapter delegates the three untouched legacy aggregate functions. Filters for source/device/browser apply only to the bio. Internal traffic is excluded by default, with an explicit warning when included. Historical and new session counts are not joined across modules.

The client checks for fresh data 15 seconds after each successful or failed request completes, with at most one request in flight. Hidden/offline tabs pause. Resuming requests current data. Superseded filter responses are discarded; failures preserve only the last successful values for the same filter context and display a stale-data warning. Each result includes the database query timestamp, distinct from the last event timestamp. This is periodic refresh, not an instantaneous push subscription.

Bio recent activity means distinct sessions with an activity signal during the last 60 seconds; the feed shows up to 12 allowlisted events from the last 5 minutes. It includes only v1 data and excludes future timestamps. It does not prove that a visitor is still present. Legacy insomnia recent signals retain their existing 10-minute definition and are labelled accordingly. Missing duration and zero-denominator rates display an em dash, not a fabricated zero. Clicks never become confirmed sales.

Stage-1 migration adds one event-time index and three functions only. It does not modify existing aggregate definitions or persistently write to legacy tables. The legacy quiz report still uses its existing transaction-local temporary table. No names, phone numbers, answers or session IDs are returned by the Studio adapter. Tables stay private under RLS and the new RPC rejects anonymous or non-allowlisted accounts.

Regression tests: run `python3 tests/studio-database.py` after the migrations in the disposable local database (the test installs synthetic legacy adapters there only), and `node tests/studio-client.mjs` in the quiz repository. Tests cover access control, scope, delayed/future events, internal exclusion, serial refresh, stale responses, authentication refresh/logout races, empty data and escaped labels.

Rollback boundary: revert only the Stage-1 `painel/` frontend commit to recover the previous panel. The additive database functions/index can remain unused; do not delete history, alter public pages or roll back the collector. The predeploy private snapshot is `analytics-studio-2026-10-15-predeploy` under the existing external backup directory. Remaining work: actual cross-page journey correlation, builder/versioned publishing, Hotmart, stronger public-ingestion abuse controls, and scheduled private-schema backups.
