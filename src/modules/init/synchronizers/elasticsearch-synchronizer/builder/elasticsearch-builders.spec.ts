import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchChallengeBuildService,
} from "./challenge.service"
import {
    ElasticsearchContentBuildService,
} from "./content.service"
import {
    ElasticsearchConsultantBuildService,
} from "./consultant.service"
import {
    ElasticsearchMilestoneTaskBuildService,
} from "./milestone-task.service"

const localizedResolver = {
    transform: jest.fn((entity: { title?: string; fullName?: string }, locale: Locale) => {
        if (entity.title !== undefined) {
            entity.title = `${entity.title}-${locale}`
        }
        if (entity.fullName !== undefined) {
            entity.fullName = `${entity.fullName}-${locale}`
        }
    }),
}

describe("Elasticsearch synchronizer builders",
    () => {
        beforeEach(() => jest.clearAllMocks())

        it("builds content documents with fallback defaults and live challenge count",
            async () => {
                const hydrated = {
                    id: "content-1", title: " Lesson ", orderIndex: 99, defaultLocale: null, challenges: [{
                        id: "challenge-1"
                    }]
                }
                const service = new ElasticsearchContentBuildService(
            {
                loadById: jest.fn().mockResolvedValue(hydrated)
            } as never,
            localizedResolver as never,
            {
                indexEntity: jest.fn()
            } as never,
                )

                const result = await service.buildMultilingualByContentId("content-1")
                await service.buildIndexById("content-1")

                expect(result).toHaveLength(Object.values(Locale).length)
                expect(result[0].entity.numChallenges).toBe(1)
                expect(result[0].entity.suggest).toEqual({
                    input: [`Lesson -${result[0].locale}`], weight: 1
                })
                expect(localizedResolver.transform).toHaveBeenCalledWith(expect.anything(),
                    result[0].locale,
                    Locale.En)
            })

        it("indexes every localized milestone task and supports an empty title",
            async () => {
                const indexEntity = jest.fn()
                const service = new ElasticsearchMilestoneTaskBuildService(
            {
                loadById: jest.fn().mockResolvedValue({
                    id: "task-1", title: "", orderIndex: 200, defaultLocale: undefined
                })
            } as never,
            localizedResolver as never,
            {
                indexEntity
            } as never,
                )

                const result = await service.buildMultilingualByMilestoneTaskId("task-1")
                await service.buildIndexById("task-1")

                expect(result[0].entity.suggest).toEqual({
                    input: [`-${result[0].locale}`], weight: 1
                })
                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
            })

        it("uses company locale fallback for consultants and indexes localized challenges",
            async () => {
                const consultant = new ElasticsearchConsultantBuildService(
            {
                loadById: jest.fn().mockResolvedValue({
                    id: "consultant-1", fullName: "Name", orderIndex: 1, company: {
                        defaultLocale: Locale.Vi
                    }
                })
            } as never,
            localizedResolver as never,
            {
                indexEntity: jest.fn()
            } as never,
                )
                const consultantResult = await consultant.buildMultilingualByHeadhunterId("consultant-1")
                await consultant.buildIndexById("consultant-1")
                expect(localizedResolver.transform).toHaveBeenCalledWith(expect.anything(),
                    consultantResult[0].locale,
                    Locale.Vi)

                const challengeIndex = jest.fn()
                const challenge = new ElasticsearchChallengeBuildService(
            {
                loadById: jest.fn().mockResolvedValue({
                    id: "challenge-1", title: "Challenge", orderIndex: 0, defaultLocale: Locale.En
                })
            } as never,
            localizedResolver as never,
            {
                indexEntity: challengeIndex
            } as never,
                )
                await challenge.buildIndexById("challenge-1")
                expect(challengeIndex).toHaveBeenCalledTimes(Object.values(Locale).length)
            })
    })
