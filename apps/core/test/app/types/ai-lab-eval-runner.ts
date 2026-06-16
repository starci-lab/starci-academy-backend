/**
 * Identifiers of the rows seeded by the AI Lab eval-runner e2e helper.
 *
 * Returned by the test's `seedEvalSetAndRun` helper so each assertion can
 * reference the persisted eval set, run, and the two ordered cases by id.
 * Test-only shape — not part of any runtime module API.
 */
export interface SeedEvalSetAndRunResult_TestOnly {
    /** Primary-key id of the seeded eval set. */
    evalSetId: string
    /** Primary-key id of the seeded Pending eval run. */
    evalRunId: string
    /** Primary-key id of the seeded exact-match case (order index 0). */
    exactCaseId: string
    /** Primary-key id of the seeded contains case (order index 1). */
    containsCaseId: string
}
