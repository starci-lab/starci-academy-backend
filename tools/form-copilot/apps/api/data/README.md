# Fixed synthetic rehearsal dataset

`fixed-dataset.json` combines 519 valid records from `MGT400_SYNTHETIC_VALID_519_v2 (2).csv` with 103 invalid records from `MGT400_INVALID_103_HEADERS_ALIGNED.xlsx`. It is not empirical survey data and does not establish real respondents' consent. The UI and operational history must retain the synthetic label.

The importer reads both sources without editing them and validates 622 unique `Synthetic_ID` values. The valid CSV contributes 519 complete 52-answer paths. The invalid workbook contributes 96 declared screening prefixes and seven complete straight-line QC exclusions.
The invalid workbook's two `D3_Status=Both` cells are normalized to the fixed form's canonical `Both studying and working` option; this exact alias is recorded in artifact provenance.

Source SHA-256: `0e410fc7bafbf13f1dee360ff130d212ed51ee9023bc786f2606872096566905`.

Valid-only canonical row SHA-256: `17f3dea3957325f8ff29d190a2899c9c0bbfe9968e2528f59eca8f7d0f0b4adb`.

Invalid workbook SHA-256: `eb5bcf2f34af9cf8ebfe8bfe4b37d232ad99cde9a81a757f3187d7935a141151`.

Combined canonical row SHA-256: `105b6d2faaa8a530f948db614ea84e399f774cb238187f3f6c0a8423edbc041d`.

The source files, ranges, join rule, derived screening path, counts and digests are embedded in the JSON. Runtime loading validates the combined digest, 519 valid rows, 103 invalid rows, every reachable screening answer and every value required by each complete form path.

## Re-import

Run `scripts/import-fixed-dataset.mjs --valid-source <valid.csv> --invalid-source <invalid.xlsx> --artifact-modules <bundled-node_modules>` using the bundled Artifact Tool runtime. `--inspect` validates and reports provenance without writing the dataset. `--capture-form` explicitly refreshes the public GET-only schema capture; review any change before accepting it. No production spreadsheet dependency is required.

## Form pin and verification limits

`fixed-form-schema.json` pins the original fixed form ID, observed public redirect, question and matrix-row IDs, full bilingual labels, required flags, and section branches. There are 12 page breaks, 21 answer blocks and 52 answer slots. The eligible path visits 12 pages and skips the screening-excluded terminal section.

The runner compares fresh public metadata to this pin, checks the visible fields and exact selected options on every visited page, follows declared branches, and requires the durable `beforeSubmit` write before the final click. A browser or confirmation error after that boundary produces `uncertain`, not success or an automatic retry. Login, CAPTCHA, new controls, missing labels and changed schemas stop execution.

Tests verify all 52 selections, the answerless early-close page, durable intent ordering and confirmation against local fixtures. Every fixture request is intercepted; none reaches Google. A separate read-only production-build probe verified the public first-page DOM and matching schema. No live Next/Submit clicks, live full traversal, or live confirmation were performed or verified during development.

Live submissions default off. Browser launches use a fresh context per row, headless by default, Chromium sandbox enabled, and the installed Playwright executable unless `FORM_COPILOT_BROWSER_EXECUTABLE_PATH` is explicitly set. There is no automatic sandbox-disabling fallback.
