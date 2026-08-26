import {
    buildCompletionSuggest, runCompletionSuggest
} from "./completion"

describe("completion helpers",
    () => {
        it("cleans inputs and clamps weight",
            () => {
                expect(buildCompletionSuggest({
                    inputs: [" a ",
                        "",
                        "b"], weight: 0.5
                })).toEqual({
                    input: ["a",
                        "b"], weight: 1
                })
            })
        it("returns empty for blank prefix and maps options",
            async () => {
                const client = {
                    search: jest.fn().mockResolvedValue({
                        suggest: {
                            items: [{
                                options: [{
                                    _id: "1", text: "Alpha"
                                }]
                            }]
                        }
                    })
                }
                await expect(runCompletionSuggest({
                    client: client as never, index: "idx", prefix: "  ", limit: 2
                })).resolves.toEqual([])
                await expect(runCompletionSuggest({
                    client: client as never, index: "idx", prefix: "a", limit: 99
                })).resolves.toEqual([{
                    id: "1", label: "Alpha"
                }])
                expect(client.search).toHaveBeenCalled()
            })
    })
