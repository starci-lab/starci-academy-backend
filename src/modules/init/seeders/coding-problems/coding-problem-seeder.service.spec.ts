import {
    CodingProblemSeederService,
} from "./coding-problem-seeder.service"

describe("CodingProblemSeederService",
    () => {
        const makeService = (enabled: boolean, parsed: Array<unknown>) => {
            const parser = {
                parseMany: jest.fn().mockResolvedValue(parsed),
            }
            const insert = {
                upsertMany: jest.fn().mockResolvedValue(parsed.length),
            }
            const hintIndex = {
                indexMany: jest.fn().mockResolvedValue(undefined),
            }
            const winston = {
                log: jest.fn(),
            }
            const service = new CodingProblemSeederService(parser as never,
            insert as never,
            hintIndex as never,
            winston as never,
            {
                isCodingProblemsSeederEnabled: jest.fn().mockReturnValue(enabled),
            } as never)
            return {
                service,
                parser,
                insert,
                hintIndex,
                winston,
            }
        }

        it("skips parsing when disabled",
            async () => {
                const harness = makeService(false,
                    [])
                await harness.service.seed()
                expect(harness.parser.parseMany).not.toHaveBeenCalled()
            })
        it("skips inserts and indexing when the mount is empty",
            async () => {
                const harness = makeService(true,
                    [])
                await harness.service.seed()
                expect(harness.insert.upsertMany).not.toHaveBeenCalled()
                expect(harness.hintIndex.indexMany).not.toHaveBeenCalled()
            })
        it("upserts, indexes, and logs a non-empty problem mount",
            async () => {
                const parsed = [{
                    id: "problem-1",
                }]
                const harness = makeService(true,
                    parsed)
                await harness.service.seed()
                expect(harness.insert.upsertMany).toHaveBeenCalledWith(parsed)
                expect(harness.hintIndex.indexMany).toHaveBeenCalledWith(parsed)
                expect(harness.winston.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        seeder: "coding-problems",
                        upserted: 1,
                    }))
            })
    })
