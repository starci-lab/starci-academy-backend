/** Throttler preset (soft / medium / strict). */
export enum ThrottlerConfig {
    /** Loose cap (100/min, 1000/hr) -- browse/read endpoints that must stay usable. */
    Soft = "soft",
    /** Mid cap (30/min, 300/hr) -- typical authenticated writes. */
    Medium = "medium",
    /** Tight cap (10/min, 100/hr) -- expensive or abuse-prone mutations. */
    Strict = "strict",
}
