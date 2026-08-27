import type {
    QueryRunner,
} from "typeorm"
import {
    CreateAiExecutionControlFoundation1787900000000,
} from "./1787900000000-CreateAiExecutionControlFoundation"

describe("CreateAiExecutionControlFoundation1787900000000",
    () => {
        it("creates only the three dark control-plane tables with frozen guards",
            async () => {
                const statements: Array<string> = []
                const queryRunner = {
                    query: jest.fn(async (statement: string) => {
                        statements.push(statement)
                        return []
                    }),
                } as unknown as QueryRunner

                await new CreateAiExecutionControlFoundation1787900000000().up(queryRunner)
                const sql = statements.join("\n")

                expect(sql.match(/CREATE TABLE/g)).toHaveLength(3)
                expect(sql).toContain("\"ai_runtime_incarnations\"")
                expect(sql).toContain("\"ai_runtime_control\"")
                expect(sql).toContain("\"ai_executions\"")
                expect(sql).toContain("uq_ai_runtime_incarnations_one_active")
                expect(sql).toContain("ck_ai_executions_state_shape")
                expect(sql).toContain("ON DELETE SET NULL")
                expect(sql).toContain("ON DELETE RESTRICT")
                expect(sql).toContain("starci_core_runtime")
                expect(sql).toContain("false")
            })

        it("drops the three resources in dependency order",
            async () => {
                const statements: Array<string> = []
                const queryRunner = {
                    query: jest.fn(async (statement: string) => {
                        statements.push(statement)
                        return []
                    }),
                } as unknown as QueryRunner

                await new CreateAiExecutionControlFoundation1787900000000().down(queryRunner)

                expect(statements).toEqual([
                    "DROP TABLE \"public\".\"ai_executions\"",
                    "DROP TABLE \"public\".\"ai_runtime_control\"",
                    "DROP INDEX \"public\".\"uq_ai_runtime_incarnations_one_active\"",
                    "DROP TABLE \"public\".\"ai_runtime_incarnations\"",
                ])
            })
    })
