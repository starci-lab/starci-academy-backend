import {
    AbstractSuggestionsHandler,
} from "./abstract-suggestions.handler"

class TestSuggestionsHandler extends AbstractSuggestionsHandler<{
    params: {
        locale?: never
        request: {
            query: string
            limit?: number
        }
    }
}> {
    protected readonly entityName = "TestEntity"

    public run(query: Parameters<TestSuggestionsHandler["execute"]>[0]) {
        return this.execute(query)
    }
}

describe("AbstractSuggestionsHandler",
    () => {
        it("returns no suggestions without querying Elasticsearch for a blank prefix",
            async () => {
                const indicateName = jest.fn()
                const handler = new TestSuggestionsHandler({
                    indicateName,
                    client: {
                        search: jest.fn(),
                    },
                } as never)

                await expect(handler.run({
                    params: {
                        request: {
                            query: "   ",
                        },
                    },
                } as never)).resolves.toEqual({
                    data: [],
                })
                expect(indicateName).not.toHaveBeenCalled()
            })

        it("resolves the entity index and maps completion options",
            async () => {
                const search = jest.fn().mockResolvedValue({
                    suggest: {
                        items: [{
                            options: [{
                                _id: "id-1",
                                text: "NestJS",
                            }],
                        }],
                    },
                })
                const indicateName = jest.fn().mockReturnValue("test-en")
                const handler = new TestSuggestionsHandler({
                    indicateName,
                    client: {
                        search,
                    },
                } as never)

                await expect(handler.run({
                    params: {
                        locale: undefined,
                        request: {
                            query: " nest ",
                            limit: 3,
                        },
                    },
                } as never)).resolves.toEqual({
                    data: [{
                        id: "id-1",
                        label: "NestJS",
                    }],
                })
                expect(indicateName).toHaveBeenCalledWith({
                    entity: "TestEntity",
                    locale: undefined,
                })
                expect(search).toHaveBeenCalledWith(expect.objectContaining({
                    index: "test-en",
                }))
            })
    })
