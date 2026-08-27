import {
    AddClozeContractToFlashcardQuizSessions1787800000000
} from "./1787800000000-AddClozeContractToFlashcardQuizSessions"

if (typeof describe === "function") {
    describe("AddClozeContractToFlashcardQuizSessions1787800000000",
        () => {
            it("preflights XP, cleans duplicate active rows, then binds v1 constraints and indexes",
                async () => {
                    const queries: Array<string> = []
                    const runner = {
                        query: jest.fn(async (sql: string) => { queries.push(sql) })
                    }
                    await new AddClozeContractToFlashcardQuizSessions1787800000000().up(runner as never)
                    const sql = queries.join("\n")
                    expect(sql.indexOf("duplicate flashcardQuiz XP")).toBeLessThan(sql.indexOf("ADD COLUMN"))
                    expect(sql.indexOf("legacy_duplicate_active")).toBeLessThan(sql.indexOf("uq_flashcard_quiz_active_enrollment"))
                    expect(sql).toContain("contract_version IS DISTINCT FROM 1")
                    expect(sql).toContain("answer_version >= 0")
                    expect(sql).toContain("uq_flashcard_quiz_start_request")
                    expect(sql).toContain("uq_xp_flashcard_quiz_session")
                })

            it("keeps additive data columns on down",
                async () => {
                    const query = jest.fn()
                    await new AddClozeContractToFlashcardQuizSessions1787800000000().down({
                        query
                    } as never)
                    expect(query.mock.calls.flat().join("\n")).not.toContain("DROP COLUMN")
                })
        })
}
