import {
    Injectable,
} from "@nestjs/common"
import {
    codingProblemHintIndexName,
} from "@modules/integrations/elasticsearch/constants/elasticsearch"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ParsedCodingProblem,
} from "../types"

@Injectable()
/**
 * Indexes coding-problem "approach hint" markdown into Elasticsearch only.
 *
 * Hints are deliberately NOT persisted to Postgres (they are large free-text
 * guidance, not query/judge data) and do NOT go to the CDN. Each hint is stored
 * in the per-locale index `coding-problem-hints-<locale>` keyed by problem slug,
 * so the detail-view query can fetch it by `get(index, id=slug)`.
 */
export class CodingProblemHintIndexService {
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Upsert every problem's localized hints into Elasticsearch.
     * @param problems - parsed problems carrying their per-locale hint markdown
     * @returns number of hint documents indexed
     */
    async indexMany(problems: Array<ParsedCodingProblem>): Promise<number> {
        // make sure each per-locale index exists before writing into it
        for (const locale of Object.values(Locale)) {
            await this.ensureIndex(codingProblemHintIndexName(locale))
        }
        // index one document per (problem, locale-with-a-hint)
        let indexed = 0
        for (const problem of problems) {
            for (const [locale,
                hint] of Object.entries(problem.hints)) {
                // skip locales without a hint file
                if (!hint) {
                    continue
                }
                await this.elasticsearchService.client.index({
                    index: codingProblemHintIndexName(locale),
                    id: problem.slug,
                    body: {
                        slug: problem.slug,
                        hint,
                    },
                })
                indexed += 1
            }
        }
        return indexed
    }

    /**
     * Create the index if it does not exist yet. The hint blob uses dynamic
     * mapping (no search over it -- only `get` by slug), so no explicit mapping
     * is required. An already-exists race is swallowed.
     *
     * @param index - fully-qualified per-locale index name
     */
    private async ensureIndex(index: string): Promise<void> {
        const existsResult = await this.elasticsearchService.client.indices.exists({
            index,
        })
        const exists = typeof existsResult === "boolean"
            ? existsResult
            : (existsResult as { body: boolean }).body
        if (exists) {
            return
        }
        try {
            await this.elasticsearchService.client.indices.create({
                index,
            })
        } catch {
            // another worker may have created it first -- safe to ignore
        }
    }
}
