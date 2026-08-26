import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    IndexerChallengeBuildService,
} from "./challenge.service"

describe("IndexerChallengeBuildService",
    () => {
        it("resolves the parent chain and caches searchable display ids",
            async () => {
                const findOne = jest.fn()
                    .mockResolvedValueOnce({
                        id: "ch-1", displayId: "challenge" , contentId: "content-1"
                    })
                    .mockResolvedValueOnce({
                        id: "content-1", displayId: "content", moduleId: "module-1"
                    })
                    .mockResolvedValueOnce({
                        id: "module-1", displayId: "module", courseId: "course-1"
                    })
                    .mockResolvedValueOnce({
                        id: "course-1", displayId: "course"
                    })
                const set = jest.fn()
                const service = new IndexerChallengeBuildService({
                    findOne
                } as never,
{
    set
} as never)

                await service.buildIndexerById("ch-1")

                expect(set).toHaveBeenCalledWith({
                    key: CacheKey.ParentIndex,
                    args: [ChallengeEntity.name,
                        "ch-1"],
                    cacheResult: {
                        challenge: {
                            id: "ch-1", displayId: "challenge"
                        },
                        content: {
                            id: "content-1", displayId: "content"
                        },
                        module: {
                            id: "module-1", displayId: "module"
                        },
                        course: {
                            id: "course-1", displayId: "course"
                        },
                    },
                })
            })

        it("fails clearly when the challenge is missing",
            async () => {
                const service = new IndexerChallengeBuildService({
                    findOne: jest.fn().mockResolvedValue(null)
                } as never,
{
    set: jest.fn()
} as never)
                await expect(service.buildIndexerById("missing")).rejects.toThrow("Challenge not found")
            })

        it.each([
            ["content",
                [{
                    id: "ch", contentId: "content"
                },
                null]],
            ["module",
                [{
                    id: "ch", contentId: "content"
                },
                {
                    id: "content", moduleId: "module"
                },
                null]],
            ["course",
                [{
                    id: "ch", contentId: "content"
                },
                {
                    id: "content", moduleId: "module"
                },
                {
                    id: "module", courseId: "course"
                },
                null]],
        ])("rejects when the parent %s is missing",
            async (_parent, rows) => {
                const findOne = jest.fn()
                rows.forEach((row) => findOne.mockResolvedValueOnce(row))
                const service = new IndexerChallengeBuildService({
                    findOne
                } as never,
{
    set: jest.fn()
} as never)

                await expect(service.buildIndexerById("ch")).rejects.toThrow()
            })
    })
