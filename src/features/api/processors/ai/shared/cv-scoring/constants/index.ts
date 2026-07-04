import type {
    CvTemplateLevel,
} from "../types"

/** Lowest possible CV score. */
export const CV_SCORE_MIN = 0

/** Highest possible CV score. */
export const CV_SCORE_MAX = 100

/** Default rubric level when a caller does not supply one. */
export const DEFAULT_CV_TEMPLATE_LEVEL: CvTemplateLevel = "mid"

/**
 * Human-readable expectation blurb per rubric level, folded into the scoring
 * prompt so the model grades against the right seniority bar. (One rubric,
 * parameterized by level — matches WF-03b's "default 1 rubric, expand later".)
 */
export const CV_LEVEL_EXPECTATIONS: Record<CvTemplateLevel, string> = {
    junior: "Entry-level engineer: clear fundamentals, real projects, and evidence of learning velocity. Bullets should show what was built and the technologies used.",
    mid: "Mid-level engineer: consistent delivery, ownership of features, and quantified impact. Bullets should show scope, technical decisions, and measurable outcomes.",
    senior: "Senior engineer: system-level ownership, cross-cutting impact, mentorship/leadership, and strong quantified business outcomes. Bullets should show scale and influence.",
}

/**
 * STRICT-JSON output contract the scoring model must return. Kept as a constant
 * object (mirrors the git-grade `template.json`) so the prompt and the parser
 * share one shape — `score` is the holistic 0–100 number, `items` are the
 * per-observation feedback entries.
 */
export const CV_SCORE_OUTPUT_TEMPLATE = {
    shortFeedback: "<one-line summary of the CV's overall quality | type: string>",
    score: "<holistic CV score 0-100 | type: number | eg: 78>",
    items: [
        {
            severity: "<low | medium | high | type: string>",
            section: "<rubric section this relates to, eg: impact | clarity | skills | structure | type: string>",
            message: "<explanation of the strength or gap | type: string>",
            suggestion: "<concrete improvement, or null when already satisfied | type: string | null>",
        },
    ],
}
