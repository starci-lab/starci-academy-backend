/**
 * Entry Node (`nest build` → dist/main.js) — chỉ gọi `bootstrap()`.
 * (EN: Node entry — invokes exported `bootstrap()` only.)
 */
import {
  bootstrap,
} from "./bootstrap"

void bootstrap()
