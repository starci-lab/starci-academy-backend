/** Minimum allowed holistic CV analyze score. */
export const CV_ANALYZE_SCORE_MIN = 0

/** Maximum allowed holistic CV analyze score. */
export const CV_ANALYZE_SCORE_MAX = 100

/**
 * Parse and clamp the analyze-step `score` field to a whole number in 0–100.
 *
 * @param raw - Value from model JSON (`number` or numeric string).
 * @returns Rounded score, or `null` when the field is omitted.
 */
export function parseCvAnalyzeScore(
    raw: unknown,
): number | null {
    if (raw === undefined || raw === null) {
        return null
    }
    const n = typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim() !== ""
            ? Number(raw)
            : Number.NaN
    if (!Number.isFinite(n)) {
        throw new Error("Field \"score\" must be a finite number (0–100).")
    }
    return Math.round(
        Math.min(
            CV_ANALYZE_SCORE_MAX,
            Math.max(
                CV_ANALYZE_SCORE_MIN,
                n,
            ),
        ),
    )
}
