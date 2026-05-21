/**
 * Entry Node (`nest build` → dist/main.js) — import Sentry instrument trước, rồi gọi bootstrap.
 * (EN: Node entry (`nest build` → dist/main.js) — import Sentry instrument first, then invoke bootstrap.)
 */

// Sentry phải được import đầu tiên để hook vào runtime trước mọi module khác.
// (EN: Sentry must be imported first to hook into runtime before any other module.)
import "./instrument"

import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
