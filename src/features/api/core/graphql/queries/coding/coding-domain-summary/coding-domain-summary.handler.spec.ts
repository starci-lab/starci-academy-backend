import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    CodingDomainSummaryHandler,
} from "./coding-domain-summary.handler"
import {
    CodingDomainSummaryQuery,
} from "./coding-domain-summary.query"

/**
 * The twin spec for {@link CodingDomainSummaryHandler}.
 *
 * THE CASES WERE ENUMERATED BEFORE THE FIRST `it`, from the handler's decisions rather than from
 * its branches, and the list is written here so it can be counted against the file:
 *
 *   1. buckets present            -> mapped to { domain, total }
 *   2. buckets empty              -> empty domains
 *   3. aggregation absent         -> empty domains
 *   4. buckets key absent         -> empty domains
 *   5. the search rejects         -> empty domains, and it does NOT rethrow
 *   6. the index is always `en`   -> never the caller's locale
 *   7. `size: 0` is sent          -> no documents are paged in to be thrown away
 *   8. the `enabled` filter is sent
 *   9. the terms `size` equals the CodingDomain cardinality
 *
 * Cases 1-5 assert the RETURNED value. Cases 6-9 assert the request object that was sent, which is
 * a value assertion rather than a `toHaveBeenCalled` restatement of the source: each of the four is
 * a promise the handler makes that would break silently. A `size` smaller than the enum drops the
 * smallest buckets with no error at all, which is exactly the failure case 9 exists to catch.
 */

/** Minimal stand-in for the Elasticsearch client surface this handler uses. */
interface ElasticsearchClientMock {
    /** Programmed per-test: resolves an aggregation response, or rejects. */
    search: jest.Mock
}

describe("CodingDomainSummaryHandler",
    () => {
        let module: TestingModule
        let handler: CodingDomainSummaryHandler
        let elasticsearchClient: ElasticsearchClientMock
        let elasticsearchService: jest.Mocked<Pick<ElasticsearchService, "indicateName">>

        /** The query carries no request; the params wrapper is what travels the bus. */
        const query = new CodingDomainSummaryQuery({
            request: undefined,
        })

        /** Program the ES `search` to return the given buckets. */
        const programBuckets = (
            buckets: Array<{ key: string, doc_count: number }>,
        ): void => {
            elasticsearchClient.search.mockResolvedValueOnce({
                aggregations: {
                    byDomain: {
                        buckets,
                    },
                },
            })
        }

        /** The request body the handler sent to Elasticsearch. */
        const sentBody = (): Record<string, unknown> =>
            elasticsearchClient.search.mock.calls[0][0] as Record<string, unknown>

        beforeEach(async () => {
            elasticsearchClient = {
                search: jest.fn(),
            }
            elasticsearchService = {
                indicateName: jest.fn(() => "coding-problems-en"),
                client: elasticsearchClient,
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">>

            module = await Test.createTestingModule({
                providers: [
                    CodingDomainSummaryHandler,
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchService,
                    },
                ],
            }).compile()

            handler = module.get<CodingDomainSummaryHandler>(CodingDomainSummaryHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        // 1
        it("maps each bucket to its domain and its count",
            async () => {
                programBuckets([
                    {
                        key: CodingDomain.Arrays,
                        doc_count: 12,
                    },
                    {
                        key: CodingDomain.DynamicProgramming,
                        doc_count: 14,
                    },
                ])

                const result = await handler.execute(query)

                expect(result.domains).toEqual([
                    {
                        domain: CodingDomain.Arrays,
                        total: 12,
                    },
                    {
                        domain: CodingDomain.DynamicProgramming,
                        total: 14,
                    },
                ])
            })

        // 2
        it("returns no domains when the aggregation came back with no buckets",
            async () => {
                programBuckets([])

                const result = await handler.execute(query)

                expect(result.domains).toEqual([])
            })

        // 3
        it("returns no domains when the response carries no aggregation at all",
            async () => {
                elasticsearchClient.search.mockResolvedValueOnce({
                })

                const result = await handler.execute(query)

                expect(result.domains).toEqual([])
            })

        // 4
        it("returns no domains when the aggregation carries no buckets key",
            async () => {
                elasticsearchClient.search.mockResolvedValueOnce({
                    aggregations: {
                        byDomain: {
                        },
                    },
                })

                const result = await handler.execute(query)

                expect(result.domains).toEqual([])
            })

        // 5 - the index has not been built yet, which the catalog list also answers with an empty
        // result rather than an error. This asserts the handler does not rethrow.
        it("returns no domains, and does not throw, when the index is missing",
            async () => {
                elasticsearchClient.search.mockRejectedValueOnce(
                    new Error("index_not_found_exception"),
                )

                await expect(handler.execute(query)).resolves.toEqual({
                    domains: [],
                })
            })

        // 6 - a domain's size is a fact about the catalog, not about which translations exist
        it("always counts the English index",
            async () => {
                programBuckets([])

                await handler.execute(query)

                expect(elasticsearchService.indicateName).toHaveBeenCalledWith({
                    entity: CodingProblemEntity.name,
                    locale: Locale.En,
                })
            })

        // 7
        it("asks for no documents, only buckets",
            async () => {
                programBuckets([])

                await handler.execute(query)

                expect(sentBody().size).toBe(0)
            })

        // 8
        it("counts only enabled problems",
            async () => {
                programBuckets([])

                await handler.execute(query)

                expect(sentBody()).toMatchObject({
                    query: {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        enabled: true,
                                    },
                                },
                            ],
                        },
                    },
                })
            })

        // 9 - a terms size below the enum cardinality drops the smallest buckets SILENTLY, so a
        // twenty-first domain would vanish from the list with nothing to say so
        it("allows one bucket per member of the domain enum",
            async () => {
                programBuckets([])

                await handler.execute(query)

                const aggs = sentBody().aggs as {
                    byDomain: { terms: { field: string, size: number } }
                }
                expect(aggs.byDomain.terms.field).toBe("domain")
                expect(aggs.byDomain.terms.size).toBe(Object.keys(CodingDomain).length)
            })
    })
