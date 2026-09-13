# Fixed synthetic rehearsal dataset

`fixed-dataset.json` contains all 639 synthetic source records. Of these, 112 carry a source answer that the pinned form routes to its answerless early-close page; 527 carry a complete 53-answer path. The complete paths comprise 519 valid rows and 8 quality-excluded straight-line rows. It is not empirical survey data and does not establish real respondents' consent. The UI and operational history must retain the synthetic label.

The importer reads `StarCi_MERGED_639_VALID519_INVALID120_REHEARSAL_FORM_READY.xlsx` without editing the workbook. It reconciles `MERGED_639_REHEARSAL` with `Row_Mapping` by the declared merged Excel row. The 519 valid rows retain their `SYN-V` source IDs. The 120 invalid rows receive deterministic IDs `SYN-I001` through `SYN-I120` in merged-row order. Blank downstream answers after a screening exit are never invented.

Source SHA-256: `a569369f211e06053ca74a8e08c56a9891a5bf086cc933e9a399b5ff6f12040a`.

Canonical row SHA-256: `0b040e996558ca77273e4d794c0ce22a6328eef7a668071e77ab17ce5537c136`.

The source ranges, join rule, ID strategy, counts and digests are embedded in the JSON. Runtime loading validates the digest, 639 unique IDs, every reachable screening answer, and all values present on the branch a row actually follows. Missing downstream values are allowed only after a declared screen-out branch; values are never invented.

## Re-import

Run `scripts/import-fixed-dataset.mjs --source <workbook.xlsx> --artifact-modules <bundled-node_modules>` using the bundled Artifact Tool runtime. `--inspect` validates and reports provenance without writing the dataset. `--capture-form` explicitly refreshes the public GET-only schema capture; review any change before accepting it. No production spreadsheet dependency is required.

## Form pin and verification limits

`fixed-form-schema.json` pins the public form ID and edit-form metadata, question and matrix-row IDs, full bilingual labels, required flags, and section branches. There are 13 page breaks, 22 answer blocks and 53 answer slots, including `SMM_OVERALL`. The eligible path skips the screening-excluded terminal section.

The runner compares fresh public metadata to this pin, checks the visible fields and exact selected options on every visited page, follows declared branches, and requires the durable `beforeSubmit` write before the final click. A browser or confirmation error after that boundary produces `uncertain`, not success or an automatic retry. Login, CAPTCHA, new controls, missing labels and changed schemas stop execution.

Tests verify all 53 selections, the answerless early-close page, durable intent ordering and confirmation against local fixtures. Every fixture request is intercepted; none reaches Google. A separate read-only production-build probe verified the public first-page DOM and matching schema. No live Next/Submit clicks, live full traversal, or live confirmation were performed or verified during development.

Live submissions default off. Browser launches use a fresh context per row, headless by default, Chromium sandbox enabled, and the installed Playwright executable unless `FORM_COPILOT_BROWSER_EXECUTABLE_PATH` is explicitly set. There is no automatic sandbox-disabling fallback.
