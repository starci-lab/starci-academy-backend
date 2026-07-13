import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"

/**
 * Request to have the SERVER pick a mock-interview prompt for one course +
 * seniority level. Unlike Pha 1 (client-side `drawRandomPrompt` from the full
 * `mockInterviewPrompts` list), the client never sees/sends which prompt was
 * drawn — it only asks for one, and `gradeMockInterviewSession` later grades
 * against whatever the server actually handed back (looked up by
 * `sessionId`), not whatever the client echoes.
 */
@InputType({
    description: "Ask the server to draw a mock-interview prompt for one course + level.",
})
export class StartMockInterviewSessionRequest {
    @Field(
        () => ID,
        {
            description: "Course to draw a prompt for — scopes the capstone pool + the resolved enrollment.",
        },
    )
        courseId: string

    /**
     * Free-form string (not an enum) mirroring the FE's Pha-1 TIER_CONFIG
     * literal ("junior" | "middle" | "senior"); an unrecognized value falls
     * back to "middle" for pool selection rather than throwing, so a future FE
     * tier label never hard-breaks the draw.
     */
    @Field(
        () => String,
        {
            description: "Seniority level to draw for (\"junior\" | \"middle\" | \"senior\"); unrecognized falls back to \"middle\".",
        },
    )
        level: string

    /**
     * The TOP-LEVEL flow to draw for — one of
     * {@link import("@modules/databases").MockInterviewMode} ("qna" |
     * "design"). Free-form string (not a pg enum, mirroring `level`);
     * unrecognized falls back to "qna" for pool selection. "qna" draws N
     * flashcard-card seeds, EACH randomly assigned its own cognitive frame
     * (theory/reasoning/scenario — mixed within the session); "design" keeps
     * the EXISTING capstone/classic 5-phase draw unchanged. "Mode split"
     * (2026-07-06) — this REPLACES the earlier per-session `kind` field; the
     * client no longer picks a cognitive frame at setup at all.
     */
    @Field(
        () => String,
        {
            description: "Top-level flow to draw for (\"qna\" | \"design\"); unrecognized falls back to \"qna\".",
        },
    )
        mode: string

    /**
     * Programming language CHOSEN at session start (the setup screen's language
     * picker, like {@link level}). For a code-rendering question (debug/review/
     * optimize authored with per-language `bodies/`) the server renders THIS
     * language's `prompt` + `givenCode` and grades against THIS language's
     * `idealAnswer`. Free-form string ("typescript" | "java" | "csharp" | "go");
     * omitted/unrecognized falls back to "typescript" (or the question's agnostic
     * root when its chosen-language body is absent). No-code questions ignore it.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Programming language chosen at session start (\"typescript\" | \"java\" | \"csharp\" | \"go\"); code questions render + grade in this language. Omitted falls back to \"typescript\".",
        },
    )
        lang?: string

    /**
     * How many Q&A questions to draw ("mode=\"qna\"" only) — the "Tùy chỉnh"
     * (Configurable) setup screen's "Số câu" control (3 | 5 | 10). Omitted
     * (or an unrecognized value) falls back to the same default the "Tự
     * động" (Auto) mode always used ({@link import("../start-mock-interview-session-draw.service").QNA_SEED_COUNT}
     * = 5) — an Auto draw never sends this field at all.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "How many Q&A questions to draw (3 | 5 | 10); mode=\"qna\" only, unrecognized/omitted falls back to 5.",
        },
    )
        questionCount?: number

    /**
     * Which cognitive frames ("mode=\"qna\"" only) each drawn question may be
     * assigned — the "Tùy chỉnh" (Configurable) setup screen's "Kiểu câu"
     * multi-select ("Tất cả" collapses to omitting this field entirely; a
     * subset like `["theory","reasoning"]` restricts every drawn seed's
     * randomly-assigned kind to that subset). Omitted/empty = every kind
     * (theory | reasoning | scenario) — the same behavior the "Tự động"
     * (Auto) mode always had.
     */
    @Field(
        () => [String],
        {
            nullable: true,
            description: "Restrict each drawn question's randomly-assigned kind to this subset (\"theory\" | \"reasoning\" | \"scenario\"); omitted/empty = all 3.",
        },
    )
        kinds?: Array<string>

    /**
     * Whether this session's graded attempt should feed job-readiness's
     * rolling mock-interview average — true for every "Tự động" (Auto) qna
     * draw and every "design" draw, FALSE for a "Tùy chỉnh" (Configurable)
     * qna draw (deliberate, learner-picked practice must never inflate/
     * dilute the readiness signal, which is meant to read like a random
     * exam). Defaults to true when omitted so an older FE build (or a
     * design-mode request, which never sends this at all) still counts.
     */
    @Field(
        () => Boolean,
        {
            nullable: true,
            defaultValue: true,
            description: "Whether this session's graded attempt should feed job-readiness (\"Tùy chỉnh\" qna sessions must send false); defaults to true.",
        },
    )
        countsToReadiness?: boolean
}
