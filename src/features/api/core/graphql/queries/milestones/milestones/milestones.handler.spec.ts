// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    MilestonesHandler,
} from "./milestones.handler"
import {
    MilestonesQuery,
} from "./milestones.query"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    TestEsSourceRow,
} from "./types/es-search"

/** Build an ES search response whose hits carry the given `_source` rows. */
const buildSearchResponse = (
    rows: Array<TestEsSourceRow>,
): unknown => ({
    hits: {
        hits: rows.map((row) => ({
            _source: row,
        })),
    },
})

describe("MilestonesHandler",
    () => {
        let module: TestingModule
        let handler: MilestonesHandler
        let elasticsearch: jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
            client: { search: jest.Mock }
        }

        beforeEach(async () => {
            elasticsearch = {
                indicateName: jest.fn(() => "milestones-vi"),
                client: {
                    search: jest.fn(),
                },
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">> & {
                client: { search: jest.Mock }
            }

            module = await Test.createTestingModule({
                providers: [
                    MilestonesHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearch,
                    },
                ],
            }).compile()

            handler = module.get<MilestonesHandler>(MilestonesHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("maps hits scoped to the course, ordered by orderIndex",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([
                        {
                            id: "ms-1",
                        },
                        {
                            id: "ms-2",
                        },
                    ]),
                )

                const result = await handler.execute(
                    new MilestonesQuery({
                        request: {
                            courseId: "course-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result.data.map((milestone) => milestone.id)).toEqual([
                    "ms-1",
                    "ms-2",
                ])
                const searchArgs = elasticsearch.client.search.mock.calls[0][0]
                expect(JSON.stringify(searchArgs.query)).toContain("course-1")
                expect(searchArgs.sort).toEqual([
                    {
                        sortIndex: {
                            order: "asc",
                        },
                    },
                ])
            })

        it("returns empty data when the course has no milestones",
            async () => {
                elasticsearch.client.search.mockResolvedValueOnce(
                    buildSearchResponse([]),
                )

                const result = await handler.execute(
                    new MilestonesQuery({
                        request: {
                            courseId: "course-1",
                        },
                    }),
                )

                expect(result.data).toEqual([])
            })
    })
