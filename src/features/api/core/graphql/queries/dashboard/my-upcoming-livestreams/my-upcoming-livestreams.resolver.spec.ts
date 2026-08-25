import {
    MyUpcomingLivestreamsResolver 
} from "./my-upcoming-livestreams.resolver"

describe("MyUpcomingLivestreamsResolver",
    () => {
        it("skips orphan enrollments and queries only the viewer's enrollments",
            async () => {
                const entityManager = {
                    find: jest.fn().mockResolvedValue([{
                        course: null 
                    },
                    {
                        course: {
                            id: "c1", livestreamSessions: [] 
                        } 
                    }]) 
                }
                const resolver = new MyUpcomingLivestreamsResolver(entityManager as never,
{
    transform: jest.fn() 
} as never)
                await expect(resolver.execute({
                    id: "u1" 
                } as never,
"en" as never,
99)).resolves.toEqual([])
                expect(entityManager.find).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "u1" 
                            } 
                        } 
                    }))
            })
    })
