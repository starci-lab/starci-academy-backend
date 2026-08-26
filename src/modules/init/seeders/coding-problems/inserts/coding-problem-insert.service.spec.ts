import {
    CodingProblemInsertService
} from "./coding-problem-insert.service"
import {
    CodingDifficulty,
} from "@modules/databases/postgresql/primary/enums/coding-difficulty"
import {
    CodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    CodingLanguage,
} from "@modules/databases/postgresql/primary/enums/coding-language"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ParsedCodingProblem,
} from "../types"

const problem = (overrides: Partial<ParsedCodingProblem> = {
}): ParsedCodingProblem => ({
    slug: "two-sum",
    difficulty: CodingDifficulty.Easy,
    domain: CodingDomain.Arrays,
    orderIndex: 1,
    sortIndex: 0,
    enabled: true,
    tags: ["array"],
    timeLimitMs: 1000,
    memoryLimitKb: 64000,
    points: 10,
    title: "Two Sum",
    statement: "Find two values.",
    testcases: [],
    starterCodes: [],
    solutions: [],
    translations: [],
    hints: {
    },
    ...overrides,
})

describe("CodingProblemInsertService",
    () => {
        it("returns zero and leaves the manager untouched for an empty parse",
            async () => {
                const transaction = jest.fn()
                const service = new CodingProblemInsertService({
                    transaction
                } as never)
                await expect(service.upsertMany([])).resolves.toBe(0)
                expect(transaction).not.toHaveBeenCalled()
            })

        it("saves the parent and all populated child collections in one transaction",
            async () => {
                const manager = {
                    save: jest.fn().mockResolvedValue(undefined),
                    delete: jest.fn().mockResolvedValue(undefined),
                }
                const transaction = jest.fn(async (work: (value: typeof manager) => Promise<void>) => work(manager))
                const service = new CodingProblemInsertService({
                    transaction,
                } as never)
                const parsed = problem({
                    testcases: [{
                        orderIndex: 0, sortIndex: 0, input: "1 2", expectedOutput: "3", isSample: true,
                    }],
                    starterCodes: [{
                        language: CodingLanguage.Python, code: "print()"
                    }],
                    solutions: [{
                        language: CodingLanguage.Python, code: "print(3)"
                    }],
                    translations: [{
                        locale: Locale.Vi, title: "Hai so", statement: "Tim hai so."
                    }],
                })

                await expect(service.upsertMany([parsed])).resolves.toBe(1)
                expect(transaction).toHaveBeenCalledTimes(1)
                expect(manager.save).toHaveBeenCalledTimes(5)
                expect(manager.delete).toHaveBeenCalledTimes(4)
                expect(manager.save.mock.calls[0][1]).toEqual(expect.objectContaining({
                    slug: "two-sum",
                    title: "Two Sum",
                    enabled: true,
                }))
                expect(manager.save.mock.calls[1][1]).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        input: "1 2", isSample: true
                    }),
                ]))
                expect(manager.save.mock.calls[4][1]).toEqual([
                    expect.objectContaining({
                        locale: Locale.Vi, field: "title", value: "Hai so"
                    }),
                    expect.objectContaining({
                        locale: Locale.Vi, field: "statement", value: "Tim hai so."
                    }),
                ])
            })

        it("skips child saves when parsed collections are empty and processes each problem",
            async () => {
                const manager = {
                    save: jest.fn().mockResolvedValue(undefined),
                    delete: jest.fn().mockResolvedValue(undefined),
                }
                const transaction = jest.fn(async (work: (value: typeof manager) => Promise<void>) => work(manager))
                const service = new CodingProblemInsertService({
                    transaction,
                } as never)

                await expect(service.upsertMany([
                    problem(),
                    problem({
                        slug: "reverse-string", enabled: false
                    }),
                ])).resolves.toBe(2)
                expect(transaction).toHaveBeenCalledTimes(2)
                expect(manager.save).toHaveBeenCalledTimes(2)
                expect(manager.delete).toHaveBeenCalledTimes(8)
                expect(manager.save.mock.calls[1][1]).toEqual(expect.objectContaining({
                    slug: "reverse-string",
                    enabled: false,
                }))
            })

        it("propagates a transaction failure so a bad problem is not reported as inserted",
            async () => {
                const error = new Error("database unavailable")
                const transaction = jest.fn().mockRejectedValue(error)
                const service = new CodingProblemInsertService({
                    transaction,
                } as never)

                await expect(service.upsertMany([problem()])).rejects.toBe(error)
            })
    })
