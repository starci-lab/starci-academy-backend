import {
    CreateConcepts1788400000000,
} from "./1788400000000-CreateConcepts"

describe("CreateConcepts migration",
    () => {
        it("creates independent localized concept tables with private JSONB evidence",
            async () => {
                const statements: Array<string> = []
                await new CreateConcepts1788400000000().up({
                    query: jest.fn(async (sql: string) => {
                        statements.push(sql)
                    }),
                } as never)
                const sql = statements.join("\n")
                expect(statements).toHaveLength(4)
                expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"concepts\"")
                expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"concept_sections\"")
                expect(sql).toContain("\"activities\" jsonb")
                expect(sql).toContain("uq_concept_sections_concept_display_id")
                expect(sql).toContain("ON DELETE CASCADE")
                expect(sql).not.toContain("course_id")
                expect(sql).not.toContain("module_id")
            })

        it("drops only the four concept-owned tables in dependency order",
            async () => {
                const statements: Array<string> = []
                await new CreateConcepts1788400000000().down({
                    query: jest.fn(async (sql: string) => {
                        statements.push(sql)
                    }),
                } as never)
                expect(statements).toEqual([
                    "DROP TABLE IF EXISTS \"concept_section_translations\"",
                    "DROP TABLE IF EXISTS \"concept_sections\"",
                    "DROP TABLE IF EXISTS \"concept_translations\"",
                    "DROP TABLE IF EXISTS \"concepts\"",
                ])
            })
    })
