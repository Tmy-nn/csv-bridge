# CSV Bridge

A browser-only CSV integration demo by Tomoya Nishimura / ACLab. It makes a data handoff explicit: source columns, mapping, row validation, then a normalized CSV download.

- Live demo: https://csv-bridge.ai-knowledge-board.workers.dev/
- Portfolio: https://aclabtech.com/en/work/
- Source: https://github.com/Tmy-nn/csv-bridge

The sample inventory data is fictional. This is an independent portfolio demo, not a customer integration or a connection to StockFlow.

## Try it

1. Select **Load sample**, then **Read columns**.
2. Review the mapping to `sku, name, quantity, unit_price, currency`.
3. Select **Validate rows**, inspect the preview, then **Download normalized CSV**.
4. Try **Load issue sample** to see invalid quantity, duplicate SKU, unsupported currency and price precision issues. Any invalid row blocks download.

Comma-delimited UTF-8 CSV supports quoted commas, escaped double quotes, CRLF/LF and multiline quoted fields. Headers must be nonempty and unique ignoring case. Source rows must match the header width. Whitespace around mapped values is trimmed. SKUs are unique ignoring case. Quantity is an integer from 0 to 1,000,000; price uses up to 7 integer digits and 2 decimal places. Supported currencies: USD, MXN, JPY and EUR. Prices are normalized using string operations, not floating-point rounding. The demo does not apply exchange rates or currency-specific accounting policies.

## Data flow and trust boundary

```text
Static assets (Cloudflare Workers)
                 ↓
Browser tab: file/text → bounded parser → column mapping
                                      → schema validation → Blob CSV download
```

All data processing runs in the tab. There is no server API, database, AI call, telemetry, localStorage or cookie. CSV contents are not uploaded or logged by this application. The host receives normal asset requests (including IP addresses and request metadata) according to its own operational policies. Reloading the tab clears application memory; downloaded files remain under the user's control. Browser extensions, compromised devices and hosting/account compromise are outside this demo's security boundary.

## Defensive controls and limits

- Input: 256 KiB UTF-8, 1,000 data rows, 20 columns, 2,000 UTF-16 code units per cell. Local files are size-checked before reading and decoded with fatal UTF-8 validation. Pasted text is byte-checked before parsing.
- Strict quote syntax and rectangular rows prevent silent shifting or partial imports. Binary/control content is rejected. Empty data and repeated/missing mappings block validation.
- Preview cells and source headers use `textContent`; input is never inserted as HTML or evaluated as code.
- All exported cells are quoted. Formula-like leading `=`, `+`, `-`, `@` (also full-width variants), including whitespace/invisible-format prefixes, receive an apostrophe prefix. CSV quoting alone is insufficient. Importers may strip or reinterpret characters; inspect exported data and use explicit text-column import settings where appropriate. This is a defensive interchange measure, not a universal spreadsheet execution sandbox.
- CSP disallows connections, inline scripts, embedding and form submission. No arbitrary URL fetching exists. No client secrets or tokens exist.
- Only `public/` is deployed. Unknown paths return a genuine 404, not the application shell.
- Validation limits UI preview to 10 rows and issue details to 25 invalid rows; every accepted input row is still validated. Exports include all rows only if all pass.

## Run and verify

Requires Node.js 22.13 or later.

```sh
npm ci
npm test
npm run dev
```

Open http://localhost:8796. Automated tests cover multiline parsing and round trips, malformed structure, size/row/column/cell limits, mappings, schema errors, duplicate SKUs and formula defenses.

```sh
npx wrangler deploy --dry-run --outdir dist
npm run deploy
```

Deployment requires your own Cloudflare account and a suitable available Worker name. Update the canonical/OG URLs in `public/index.html` for your domain. `wrangler.jsonc` exposes only `public/`. Before publishing, audit the public directory and source for secrets and test `/.env`, `/.git/config`, `/package.json` and an unknown path for true 404 responses. The nonpublic design brief is an implementation record, not a deployable asset.

## Source rights

Source is published for portfolio inspection. Original application code and design are copyright Tomoya Nishimura / ACLab; all rights reserved unless separately agreed. No open-source license is implied. Third-party development tooling retains its own licenses. The copied ACLab design tokens are first-party assets. No third-party runtime dependencies or remote fonts are loaded.
