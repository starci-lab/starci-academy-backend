import {
    CourseCommunityService 
} from "./course-community.service"

describe("CourseCommunityService qualified aggregation",
    () => {
        it("aggregates a post page in fixed batched queries scoped by course",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    postId: "p1", count: "2" 
                }]).mockResolvedValueOnce([{
                    id: "p1", type: "like", count: "1" 
                }]).mockResolvedValueOnce([{
                    id: "p1", type: "like" 
                }])
                const service = new CourseCommunityService({
                    query 
                } as never,
{
} as never)
                const result = await service.aggregatePosts("course-a",
                    ["p1"],
                    "viewer")
                expect(query).toHaveBeenCalledTimes(3)
                for (const [sql,
                    args] of query.mock.calls) { expect(sql).toContain("p.scope='COURSE'"); expect(sql).toContain("p.course_id=$1"); expect(args[0]).toBe("course-a") }
                expect(result).toMatchObject({
                    comments: {
                        p1: 2 
                    }, reactions: {
                        p1: {
                            total: 1, myReaction: "like" 
                        } 
                    } 
                })
            })
        it("aggregates comment replies and reactions without per-row queries",
            async () => {
                const query = jest.fn().mockResolvedValueOnce([{
                    commentId: "c1", count: "4" 
                }]).mockResolvedValueOnce([]).mockResolvedValueOnce([])
                const service = new CourseCommunityService({
                    query 
                } as never,
{
} as never)
                const result = await service.aggregateComments("course-a",
                    ["c1"],
                    "viewer")
                expect(query).toHaveBeenCalledTimes(3)
                expect(result.replies.c1).toBe(4)
                expect(result.reactions.c1).toMatchObject({
                    total: 0, myReaction: null 
                })
            })
    })

describe("CourseCommunityService TypeORM pagination metadata",
    () => {
        const previousSecret = process.env.COURSE_COMMUNITY_CURSOR_SECRET
        beforeAll(() => { process.env.COURSE_COMMUNITY_CURSOR_SECRET = "course-community-query-builder-test-secret" })
        afterAll(() => { if (previousSecret === undefined) delete process.env.COURSE_COMMUNITY_CURSOR_SECRET; else process.env.COURSE_COMMUNITY_CURSOR_SECRET = previousSecret })

        it("orders feed pagination with entity property paths, not database column names",
            async () => {
                const qb = {
                    leftJoinAndSelect: jest.fn(), where: jest.fn(), andWhere: jest.fn(), orderBy: jest.fn(), addOrderBy: jest.fn(), take: jest.fn(), getMany: jest.fn().mockResolvedValue([]) 
                }
                for (const method of ["leftJoinAndSelect",
                    "where",
                    "andWhere",
                    "orderBy",
                    "addOrderBy",
                    "take"] as const) qb[method].mockReturnValue(qb)
                const cursors = {
                    queryHash: jest.fn().mockReturnValue("query-hash"), encode: jest.fn(), decode: jest.fn() 
                }
                const service = new CourseCommunityService({
                    createQueryBuilder: jest.fn().mockReturnValue(qb) 
                } as never,
cursors as never)
                await service.listFeed({
                    courseId: "course-a", user: {
                        id: "viewer" 
                    } as never, limit: 20 
                })
                expect(qb.orderBy).toHaveBeenCalledWith("post.createdAt",
                    "DESC")
                expect(qb.orderBy).not.toHaveBeenCalledWith("post.created_at",
                    expect.anything())
                expect(qb.addOrderBy).toHaveBeenCalledWith("post.id",
                    "DESC")
            })
    })
