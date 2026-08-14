import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
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
    CodingDomainSummaryQuery,
} from "./coding-domain-summary.query"
import {
    CodingDomainSummaryResponseData,
} from "./graphql-types/response"

/**
 * How many buckets the aggregation may return.
 *
 * It is the cardinality of {@link CodingDomain}, read from the enum rather than written as a
 * literal. A terms aggregation whose `size` is smaller than the number of distinct values drops the
 * smallest buckets SILENTLY -- there is no error and no flag on the response -- so a twenty-first
 * domain added to the enum would otherwise disappear from this list and nothing would say so.
 */
const DOMAIN_COUNT = Object.keys(CodingDomain).length

/** The aggregation's name, used to build it and to read it back. */
const DOMAINS_AGGREGATION = "byDomain"

/** One bucket as Elasticsearch returns it. */
interface DomainBucket {
    /** The `domain` keyword value. */
    key: string
    /** How many documents carried it. */
    doc_count: number
}

@QueryHandler(CodingDomainSummaryQuery)
@Injectable()
/**
 * Counts the enabled problems in each interview topic domain.
 *
 * IT READS THE SAME INDEX THE CATALOG LIST READS, and for the same reason: the catalog is served
 * from Elasticsearch, `domain` is mapped there as a keyword facet, and a second read store for one
 * count would be a second truth to keep in step.
 *
 * IT ALWAYS READS THE ENGLISH INDEX. A domain's size is a fact about the catalog, not about which
 * translations exist; counting the reader's own locale would show two learners different totals for
 * the same domain and neither number would be wrong. That is a product decision, recorded in the
 * architecture record rather than taken here.
 *
 * A DOMAIN WITH NO PROBLEMS IS ABSENT, not zero. That is what a terms aggregation does, and it is
 * left alone deliberately: the enum is public, so a caller that wants all twenty composes them
 * against this list rather than the server keeping a second copy of the enum in step.
 *
 * IT DOES NOT THROW ON A MISSING INDEX. The catalog list already resolves that case to an empty
 * page, so an empty summary is the same answer in the same situation. A missing index is a state
 * the client draws, not a failure it recovers from.
 */
export class CodingDomainSummaryHandler
    extends ICQRSHandler<CodingDomainSummaryQuery, CodingDomainSummaryResponseData>
    implements IQueryHandler<CodingDomainSummaryQuery, CodingDomainSummaryResponseData> {
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(): Promise<CodingDomainSummaryResponseData> {
        const index = this.elasticsearchService.indicateName({
            entity: CodingProblemEntity.name,
            locale: Locale.En,
        })

        try {
            const response = await this.elasticsearchService.client.search({
                index,
                // no hits are wanted, only the buckets -- asking for documents here would page a
                // whole catalog to throw it away
                size: 0,
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
                aggs: {
                    [DOMAINS_AGGREGATION]: {
                        terms: {
                            field: "domain",
                            size: DOMAIN_COUNT,
                        },
                    },
                },
            })

            const aggregation = response.aggregations?.[DOMAINS_AGGREGATION] as
                { buckets?: Array<DomainBucket> } | undefined

            return {
                domains: (aggregation?.buckets ?? []).map((bucket) => ({
                    domain: bucket.key as CodingDomain,
                    total: bucket.doc_count,
                })),
            }
        } catch {
            // the index has not been built yet -- the same situation the catalog list answers with
            // an empty page
            return {
                domains: [],
            }
        }
    }
}
