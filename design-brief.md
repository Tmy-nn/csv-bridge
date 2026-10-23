# CSV Bridge — design brief

Status: in-production; independent browser and security review pending.

Purpose: show a browser-only integration boundary: source CSV → explicit column mapping → validation → normalized CSV. Audience: Mexico Tech Week visitors and engineers inspecting source. ACLab portfolio, English app UI; app-ui, web, social and core specs apply. No customer material.

Reference: Superhuman. Borrow exactly three properties: one accent, two radius values (adapted to ACLab 6 / 12 px tokens), display line-height 0.96. Mobile heading uses the accessible 1.15 token. Body/data are system sans/system mono fallbacks so no third-party font request occurs. Brand uses approved purple and neutral paper; semantic colors describe validation only.

Alternatives considered: (A) a dashboard with metric cards, rejected because this is a transformation workflow, not monitoring; (B) a full-width spreadsheet editor, rejected because mapping and error provenance become hidden; (C) a narrow source rail next to a larger mapping/preview workspace, selected because one accent and compressed headline leave the data flow visible without decorative cards.

Pre-generation critique: generic upload cards would imply a remote upload and generic KPI counters would imply business results. Replace them with a visible local-only boundary, source text editor, explicit output schema, and row-specific validation results. Serif display was rejected because this is a compact operational tool; heading and utility monospace distinguish instructions from data.

Canvas: fluid desktop max 1200 px; mobile 375 px; OGP 1200 × 630 with 64 px safe area. Type sizes: 12 / 14 / 16 / 20 / 32. Spacing uses copied ACLab tokens; no shadows or gradients. OGP title CSV Bridge, ACLab signature, no fabricated screenshot.

Acceptance: keyboard operation and 44 px controls; no horizontal viewport overflow at 375 px (tables scroll within their frame); actual sample, invalid sample, quoted multiline parse, mapping reset and download; untrusted cells rendered with textContent, formula-triggering text prefixed for export, input limits enforced before expensive work; no network/storage APIs; explicit limits and no claim of universal spreadsheet safety. Private preview and source files excluded by public-only asset deployment.

States: default source text; hover/focus/active controls; selected mappings; disabled preview/download before readiness; loading local file; success validated output; warning escaped formula-like cell; error syntax/row issue; empty actionable sample button; offline transformation remains local once loaded; syncing not applicable (no server); conflict duplicate SKU/mapping, blocks download.

Self-assessment: workflow and trust boundary are concrete. Remaining risk: arbitrary spreadsheet import settings may reinterpret data; exported CSV is a defensive interchange format, not a spreadsheet sandbox. Browser and independent visual checks belong to the parent reviewer before publication.

Author measurements: CSS checker reports no out-of-scale font sizes, spacing or radii. Ink/paper 14.91:1, muted/paper 5.41:1, white/button 6.14:1, input border/white 3.71:1, link/paper 7.40:1, danger/white 6.54:1, success/white 5.38:1, warning/white 5.05:1. OGP title actual width 551 px within a 1072 px safe width; 100 px title and 32 px signature. OGP file 20,307 bytes. Node tests: 8 passed. Wrangler dry-run accepts only the 9 public asset files, with no bindings. Keyboard-accessible preview region and column header scope were added after independent source review.
