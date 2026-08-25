import {
    SearchUsersResolver 
} from "./search-users.resolver"

describe("SearchUsersResolver",
    () => {
        it("returns empty for blank input and maps source/id fallback hits",
            async () => {
                const es = {
                    indicateName: jest.fn().mockReturnValue("users"), client: {
                        search: jest.fn().mockResolvedValue({
                            hits: {
                                hits: [{
                                    _id: "fallback", _source: undefined 
                                },
                                {
                                    _id: "x", _source: {
                                        id: "u1", username: "alice", openToWork: true, points: 4 
                                    } 
                                }] 
                            } 
                        }) 
                    } 
                }
                const resolver = new SearchUsersResolver(es as never)
                await expect(resolver.execute({
                    query: "   " 
                } as never)).resolves.toEqual([])
                const rows = await resolver.execute({
                    query: "ali", limit: 99 
                } as never)
                expect(es.indicateName).toHaveBeenCalled()
                expect(es.client.search).toHaveBeenCalledWith(expect.objectContaining({
                    index: "users", size: 20 
                }))
                expect(rows).toMatchObject([{
                    username: "", points: 0 
                },
                {
                    username: "alice", openToWork: true, points: 4 
                }])
            })
    })
