import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CodingProblemNotFoundException,
} from "@modules/platform/exceptions/errors/coding/coding-problem-not-found"
import {
    codingProblemHintIndexName,
} from "@modules/integrations/elasticsearch/constants/elasticsearch"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import type {
    CodingProblemHintResult,
    CodingProblemHintSource,
    GetCodingProblemHintParams,
    GetCodingProblemParams,
    ListCodingProblemsParams,
    ListCodingProblemsResult,
} from "./types"

/** Default page size for problem listing. */
const DEFAULT_PAGE_SIZE = 20

@Injectable()
/**
 * Read-side business logic for the coding-practice problem bank: listing with
 * filters + solved flags and single-problem detail (samples only, localized).
 * Never exposes hidden testcases.
 */
export class CodingProblemService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * List enabled problems (the shared catalog) from the per-locale Elasticsearch
     * index with optional difficulty/domain/tag filters + pagination. Per-user state
     * (solved/points) is served separately by {@link CodingProgressService} -- the
     * catalog here carries no user-specific data. Documents are pre-localized
     * (title) and only catalog fields are returned (never testcases/solutions).
     *
     * @param params - filters, pagination, and locale
     * @returns the page of problems + total matching the filters
     */
    async list({
        difficulty,
        domain,
        tag,
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
        locale = Locale.En,
    }: ListCodingProblemsParams): Promise<ListCodingProblemsResult> {
        // the per-locale catalog index (same one getBySlug reads)
        const index = this.elasticsearchService.indicateName({
            entity: CodingProblemEntity.name,
            locale,
        })
        // only enabled problems, optionally narrowed by difficulty + tag (both keyword facets)
        const filter: Array<Record<string, unknown>> = [
            {
                term: {
                    enabled: true,
                },
            },
        ]
        if (difficulty) {
            filter.push({
                term: {
                    difficulty,
                },
            })
        }
        // the closed topic enum, not the free-text tag facet beside it -- filtering by tag would
        // return a different, overlapping set
        if (domain) {
            filter.push({
                term: {
                    domain,
                },
            })
        }
        if (tag) {
            filter.push({
                term: {
                    tags: tag,
                },
            })
        }
        const response = await this.elasticsearchService.client.search<CodingProblemEntity>({
            index,
            query: {
                bool: {
                    filter,
                },
            },
            // stable display order, paginate, and only return catalog fields
            sort: [
                {
                    orderIndex: "asc",
                },
            ],
            from: (page - 1) * limit,
            size: limit,
            _source: [
                "id",
                "slug",
                "title",
                "difficulty",
                "points",
                "domain",
                "tags",
                "sortIndex",
            ],
            // accurate total beyond the default 10k cap
            track_total_hits: true,
        })
        // map hits to entities; ES throws (caught) only on a missing index -> empty page
        const problems = response.hits.hits
            .map((hit) => hit._source)
            .filter((source): source is CodingProblemEntity => Boolean(source))
        // total can be a number or { value } depending on track_total_hits
        const rawTotal = response.hits.total
        const total = typeof rawTotal === "number" ? rawTotal : (rawTotal?.value ?? 0)
        return {
            problems,
            total,
        }
    }

    /**
     * Load one enabled problem by slug with starter code and SAMPLE testcases
     * only (hidden testcases and reference solutions are never returned),
     * localized to the locale.
     *
     * @param params - slug + locale
     * @returns the problem with sample testcases + starter codes (no solutions)
     * @throws CodingProblemNotFoundException when missing or disabled
     */
    async getBySlug({
        slug,
        locale = Locale.En,
    }: GetCodingProblemParams): Promise<CodingProblemEntity> {
        // serve the detail view straight from the per-locale index: documents are
        // pre-localized (title/statement) and only ever hold SAMPLE testcases (the ES
        // sync builder drops hidden ones + reference solutions), so nothing sensitive
        // can leak from here.
        const index = this.elasticsearchService.indicateName({
            entity: CodingProblemEntity.name,
            locale,
        })
        const response = await this.elasticsearchService.client.search<CodingProblemEntity>({
            index,
            query: {
                bool: {
                    filter: [
                        // exact slug lookup -- tolerate either keyword shape across indices
                        {
                            bool: {
                                should: [
                                    {
                                        term: {
                                            slug,
                                        },
                                    },
                                    {
                                        term: {
                                            "slug.keyword": slug,
                                        },
                                    },
                                ],
                                minimum_should_match: 1,
                            },
                        },
                        // never expose disabled problems
                        {
                            term: {
                                enabled: true,
                            },
                        },
                    ],
                },
            },
            size: 1,
        })
        const hit = response.hits.hits[0]?._source
        // missing/disabled -> typed not-found
        if (!hit) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        // Reference solutions can never leak here: they are not a GraphQL `@Field`
        // on CodingProblemEntity (so the schema never serializes them) and the ES
        // sync builder never indexes them -- exposure is gated at the schema, not by
        // read-time stripping.
        return hit
    }

    /**
     * Load a problem's localized "approach hint" markdown from Elasticsearch.
     * Hints live only in ES (index `coding-problem-hints-<locale>`, keyed by
     * slug) -- never in Postgres. Falls back to the English hint when the
     * requested locale has none, and returns null when no hint exists at all.
     *
     * @param params - slug + locale
     * @returns the hint document `{ slug, hint }`, or null when absent
     */
    async getHint({
        slug,
        locale = Locale.En,
    }: GetCodingProblemHintParams): Promise<CodingProblemHintResult | null> {
        // try the requested locale first, then fall back to English
        const candidateLocales = locale === Locale.En
            ? [Locale.En]
            : [locale,
                Locale.En]
        for (const candidate of candidateLocales) {
            const hint = await this.fetchHint(slug,
                candidate)
            if (hint !== null) {
                return hint
            }
        }
        return null
    }

    /**
     * Get one hint document by slug from a locale's index, or null when the
     * document/index is missing (ES throws 404 in both cases).
     */
    private async fetchHint(
        slug: string,
        locale: Locale,
    ): Promise<CodingProblemHintResult | null> {
        try {
            const result = await this.elasticsearchService.client.get({
                index: codingProblemHintIndexName(locale),
                id: slug,
            })
            const source = result._source as CodingProblemHintSource | undefined
            // a document with no hint body is treated as "no hint"
            if (!source?.hint) {
                return null
            }
            return {
                slug,
                hint: source.hint,
            }
        } catch {
            // 404 (missing doc or index) -> no hint for this locale
            return null
        }
    }

}
