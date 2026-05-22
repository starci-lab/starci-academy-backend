/**
 * Entry Node (`nest build` -> dist/main.js) — chi goi bootstrap da export.
 * (EN: Node entry (`nest build` -> dist/main.js) — invokes exported bootstrap only.)
 */
import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
