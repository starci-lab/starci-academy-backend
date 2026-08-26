import {
    ElasticsearchCodingProblemBuildService
} from "./coding-problem.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"

describe("ElasticsearchCodingProblemBuildService",
    () => {
        it("builds localized documents with only sample testcases and fallback fields",
            async () => {
                const problem = {
                    id: "p1", slug: "sum", title: "Sum", statement: "Base statement", orderIndex: 2,
                    translations: [{
                        locale: Locale.Vi, field: "title", value: "Localized title"
                    }],
                    testcases: [
                        {
                            isSample: true, orderIndex: 2
                        },
                        {
                            isSample: false, orderIndex: 1
                        },
                    ], starterCodes: [],
                }
                const service = new ElasticsearchCodingProblemBuildService({
                    findOneOrFail: jest.fn().mockResolvedValue(problem),
                } as never,
{
    indexEntity: jest.fn()
} as never)

                const result = await service.buildMultilingualByCodingProblemId("p1")
                expect(result).toHaveLength(Object.values(Locale).length)
                expect(result.find((item) => item.locale === Locale.Vi)?.entity.title).toBe("Localized title")
                expect(result[0].entity.testcases).toHaveLength(1)
                expect(result[0].entity.testcases?.[0]?.isSample).toBe(true)
            })

        it("indexes every locale document",
            async () => {
                const entityManager = {
                    findOneOrFail: jest.fn().mockResolvedValue({
                        id: "p1", title: "T", statement: "S", translations: [], testcases: [], starterCodes: []
                    })
                }
                const indexEntity = jest.fn().mockResolvedValue(undefined)
                const service = new ElasticsearchCodingProblemBuildService(entityManager as never,
{
    indexEntity
} as never)
                await service.buildIndexById("p1")
                expect(indexEntity).toHaveBeenCalledTimes(Object.values(Locale).length)
            })
    })
