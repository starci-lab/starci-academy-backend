# Fixed synthetic rehearsal dataset

`fixed-dataset.json` contains exactly the 519 complete synthetic records from `MGT400_SYNTHETIC_VALID_519_v2 (2).csv`. Every record follows the full 52-answer form path. It is not empirical survey data and does not establish real respondents' consent. The UI and operational history must retain the synthetic label.

The importer reads the CSV without editing it, validates 519 unique `Synthetic_ID` values, 42 complete Likert responses and three supported demographic values. The seven routing answers required to reach those valid responses are derived deterministically as the passing screening path and recorded in the artifact provenance.

Source SHA-256: `0e410fc7bafbf13f1dee360ff130d212ed51ee9023bc786f2606872096566905`.

Canonical row SHA-256: `17f3dea3957325f8ff29d190a2899c9c0bbfe9968e2528f59eca8f7d0f0b4adb`.

The source file, range, join rule, derived screening path, counts and digests are embedded in the JSON. Runtime loading validates the digest, 519 unique IDs, every screening answer and every value required by the complete form path.

## Re-import

Run `scripts/import-fixed-dataset.mjs --source <valid.csv> --artifact-modules <bundled-node_modules>` using the bundled Artifact Tool runtime. `--inspect` validates and reports provenance without writing the dataset. `--capture-form` explicitly refreshes the public GET-only schema capture; review any change before accepting it. No production spreadsheet dependency is required.

## Form pin and verification limits

`fixed-form-schema.json` pins the original fixed form ID, observed public redirect, question and matrix-row IDs, full bilingual labels, required flags, and section branches. There are 12 page breaks, 21 answer blocks and 52 answer slots. The eligible path visits 12 pages and skips the screening-excluded terminal section.

The runner compares fresh public metadata to this pin, checks the visible fields and exact selected options on every visited page, follows declared branches, and requires the durable `beforeSubmit` write before the final click. A browser or confirmation error after that boundary produces `uncertain`, not success or an automatic retry. Login, CAPTCHA, new controls, missing labels and changed schemas stop execution.

Tests verify all 52 selections, the answerless early-close page, durable intent ordering and confirmation against local fixtures. Every fixture request is intercepted; none reaches Google. A separate read-only production-build probe verified the public first-page DOM and matching schema. No live Next/Submit clicks, live full traversal, or live confirmation were performed or verified during development.

Live submissions default off. Browser launches use a fresh context per row, headless by default, Chromium sandbox enabled, and the installed Playwright executable unless `FORM_COPILOT_BROWSER_EXECUTABLE_PATH` is explicitly set. There is no automatic sandbox-disabling fallback.
