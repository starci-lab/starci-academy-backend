/**
 * Node entry (`nest build` → dist/main.js) — import Sentry instrument first, then invoke bootstrap.
 */

// Sentry must be imported first to hook into runtime before any other module.
import "./instrument"

import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
