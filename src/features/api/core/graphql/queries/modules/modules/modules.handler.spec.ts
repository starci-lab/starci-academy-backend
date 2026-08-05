// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ModulesHandler,
} from "./modules.handler"
import {
    ModulesQuery,
} from "./modules.query"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    Locale,
} from "@modules/databases"

/** Build an ES search response whose hits carry the given `_source` rows. */
const buildSearchResponse = (
    rows: Array<unknown>,
): unknown => ({
    hits: {
        hits: rows.map((row) => ({
            _source: row,
        })),
    },
})

describe("ModulesHandler",
    () => {
        let module: TestingModule
        let handler: ModulesHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "modules-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    ModulesHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<ModulesHandler>(ModulesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits and defaults a missing contents array to empty",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([
                        {
                            id: "m1",
                            contents: [
                                {
                                    id: "c1",
                                },
                            ],
                        },
                        {
                            id: "m2",
                            // no contents -> handler should normalize to []
                        },
                    ]),
                )

                const result = await handler.execute(
                    new ModulesQuery({
                        request: {
                            courseId: "course-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.data).toHaveLength(2)
                expect(result.data[0].contents).toHaveLength(1)
                // missing contents normalized to an empty array, never undefined
                expect(result.data[1].contents).toEqual([])
            })

        it("scopes the ES query to the requested course",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([]),
                )

                await handler.execute(
                    new ModulesQuery({
                        request: {
                            courseId: "course-42",
                        },
                    }),
                )

                // the course id flows into the ES term filter
                const searchArgs = JSON.stringify(
                    elasticsearch.client.search.mock.calls[0][0].query,
                )
                expect(searchArgs).toContain("course-42")
            })
    })
