# Fixed synthetic rehearsal dataset

`fixed-dataset.json` contains all 637 synthetic source records. Of these, 95 carry a source answer that the pinned form routes to its answerless early-close page; 542 carry a complete 52-answer path. It is not empirical survey data and does not establish real respondents' consent. The UI and operational history must retain the synthetic label.

The importer reads `MGT400_SYNTHETIC_Outcome_A_Rehearsal_v2.xlsx` without editing the workbook. It joins `VALID_519` to `RAW_637` by `Synthetic_ID` to verify every shared value, then imports every RAW row without inventing blank downstream answers. The workbook has 95 screening exclusions and 23 additional QC exclusions. Those 23 still follow the complete Google Form path because their screening answers are eligible; QC metadata never changes form routing. A positional join is invalid: 518 of 519 eligible positions differ between the sheets.

Source SHA-256: `12722bdf55f7c4c22d5f8c5881d16bcdc03bb18d0a3a77892fcb26f241e2f729`.

Canonical row SHA-256: `909e30bf2593cca13c3f14cc03e6800f0b955606f8826719a66685f8082adb5e`.

The source labels, ranges, join rule, counts and digests are embedded in the JSON. Runtime loading validates the digest, 637 unique IDs, every reachable screening answer, and all values present on the branch a row actually follows. Missing downstream values are allowed only after a declared screen-out branch; values are never invented.

## Re-import

Run `scripts/import-fixed-dataset.mjs --source <workbook.xlsx> --artifact-modules <bundled-node_modules>` using the bundled Artifact Tool runtime. `--inspect` validates and reports provenance without writing the dataset. `--capture-form` explicitly refreshes the public GET-only schema capture; review any change before accepting it. No production spreadsheet dependency is required.

## Form pin and verification limits

`fixed-form-schema.json` pins the original fixed form ID, observed public redirect, question and matrix-row IDs, full bilingual labels, required flags, and section branches. There are 12 page breaks, 21 answer blocks and 52 answer slots. The eligible path visits 12 pages and skips the screening-excluded terminal section.

The runner compares fresh public metadata to this pin, checks the visible fields and exact selected options on every visited page, follows declared branches, and requires the durable `beforeSubmit` write before the final click. A browser or confirmation error after that boundary produces `uncertain`, not success or an automatic retry. Login, CAPTCHA, new controls, missing labels and changed schemas stop execution.

Tests verify all 52 selections, the answerless early-close page, durable intent ordering and confirmation against local fixtures. Every fixture request is intercepted; none reaches Google. A separate read-only production-build probe verified the public first-page DOM and matching schema. No live Next/Submit clicks, live full traversal, or live confirmation were performed or verified during development.

Live submissions default off. Browser launches use a fresh context per row, headless by default, Chromium sandbox enabled, and the installed Playwright executable unless `FORM_COPILOT_BROWSER_EXECUTABLE_PATH` is explicitly set. There is no automatic sandbox-disabling fallback.
