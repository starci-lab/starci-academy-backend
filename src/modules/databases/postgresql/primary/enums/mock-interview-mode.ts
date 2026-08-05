/**
 * The TOP-LEVEL flow a mock-interview session runs -- a NEW axis introduced by
 * the "mode split" (2026-07-06), replacing the earlier per-session `kind`
 * field. A session is EITHER a multi-question Q&A run OR the existing
 * 5-phase system-design interview; they are no longer picked from the same
 * axis as the per-question cognitive frame (see
 * {@link import("./mock-interview-kind").MockInterviewKind}, which now lives
 * on each individual drawn QUESTION instead of the whole session).
 *
 * TS-only (no `registerEnumType`/pg `enum` column) -- persisted as a plain
 * `varchar` on {@link import("../entities/mock-interview-session.entity").MockInterviewSessionEntity},
 * mirroring `level`/`source`/`difficulty` on the same entity so a future mode
 * never requires a `pg_enum` migration (see the TypeORM synchronize
 * `ADD VALUE` footgun).
 */
export enum MockInterviewMode {
    /**
     * N independent Q&A questions, each RANDOMLY assigned one of the 3
     * {@link import("./mock-interview-kind").MockInterviewKind} cognitive
     * frames (theory / reasoning / scenario) at draw time -- mirrors how a
     * real interviewer mixes question styles within one session.
     */
    Qna = "qna",
    /**
     * The EXISTING 5-phase system-design interview (requirements -> estimation
     * -> highLevel -> deepDive -> tradeoffs), unchanged -- reached via its own
     * setup entry point ("Practice system design"), not the random Q&A pool.
     */
    Design = "design",
}

/**
 * Coerce a raw mode string to a known {@link MockInterviewMode}, falling back
 * to {@link MockInterviewMode.Qna} for anything unrecognized -- mirrors
 * {@link import("../../../../../features/api/core/graphql/mutations/interview/start-mock-interview-session/start-mock-interview-session-draw.service").MockInterviewSessionDrawService}'s
 * own `normalizeLevel` fallback-never-throw shape, so a future FE mode label
 * never hard-breaks the draw.
 *
 * @param value - The raw `mode` field from the request, or null/undefined.
 * @returns A known mode literal.
 */
export const normalizeMockInterviewMode = (
    value: string | null | undefined,
): MockInterviewMode => {
    const candidate = value?.trim().toLowerCase()
    const match = Object.values(MockInterviewMode).find(
        (mode) => mode === candidate,
    )
    return match ?? MockInterviewMode.Qna
}
