import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    IndexSearchService,
} from "./index-search.service"

describe("IndexSearchService",
    () => {
        it("wraps request parameters in an IndexSearchQuery",
            async () => {
                const queryBus = {
                    execute: jest.fn().mockResolvedValue({
                        items: [
                            {
                                id: "result-1",
                            },
                        ],
                    }),
                }
                const service = new IndexSearchService(queryBus as unknown as QueryBus)
                const params = {
                    request: {
                        query: "typescript",
                    },
                    locale: "en",
                }

                await expect(service.execute(params as never)).resolves.toEqual({
                    items: [
                        {
                            id: "result-1",
                        },
                    ],
                })
                expect(queryBus.execute).toHaveBeenCalledWith(
                    expect.objectContaining({
                        params,
                    }),
                )
            })

        it("propagates query failures to the caller",
            async () => {
                const failure = new Error("search unavailable")
                const queryBus = {
                    execute: jest.fn().mockRejectedValue(failure),
                }
                const service = new IndexSearchService(queryBus as unknown as QueryBus)

                await expect(service.execute({
                    request: {
                        query: "",
                    },
                    locale: "en",
                } as never)).rejects.toBe(failure)
            })

        it("returns an empty result without reshaping the query response",
            async () => {
                const queryBus = {
                    execute: jest.fn().mockResolvedValue({
                        items: []
                    }),
                }
                const service = new IndexSearchService(queryBus as unknown as QueryBus)

                await expect(service.execute({
                    request: {
                        query: "",
                    },
                    locale: "vi",
                } as never)).resolves.toEqual({
                    items: []
                })
                expect(queryBus.execute).toHaveBeenCalledTimes(1)
            })
    })
