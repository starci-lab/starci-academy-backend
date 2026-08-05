import {
    CodingProblemTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem-translation.entity"
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
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"

@Injectable()
/**
 * Builds + indexes Elasticsearch documents for a coding-practice problem across
 * all locales.
 *
 * Coding problems store an English-default `title` on the row with optional
 * per-locale overrides in their translations; there is no `defaultLocale` column,
 * so English is the fallback. Each locale document carries a `suggest` completion
 * field (problem title + popularity weight) powering the `codingProblemSuggestions`
 * autocomplete query. Distinct from the legacy `coding-problem-hints-*` indices.
 */
export class ElasticsearchCodingProblemBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Resolve a translatable field (`title` | `statement`), falling back to
     * English then the base column value.
     *
     * @param translations - The problem's loaded translation rows.
     * @param field - Field name being resolved (`"title"` | `"statement"`).
     * @param locale - Requested locale.
     * @param baseValue - English-default value stored on the problem row.
     * @returns The best available localized value (never null/undefined).
     */
    private resolveField(
        translations: Array<CodingProblemTranslationEntity>,
        field: string,
        locale: Locale,
        baseValue: string,
    ): string {
        // pick the translation row for this field + a given locale, if present
        const pick = (targetLocale: Locale): string | undefined =>
            translations.find(
                (translation) => translation.field === field
                    && translation.locale === targetLocale,
            )?.value
        // prefer requested locale -> English -> the base column value
        return pick(locale) ?? pick(Locale.En) ?? baseValue ?? ""
    }

    /**
     * Build one ES document per locale for the given problem.
     *
     * @param codingProblemId - Primary-key id of the problem to index.
     * @returns One `{ locale, entity }` pair per supported locale.
     */
    async buildMultilingualByCodingProblemId(
        codingProblemId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<CodingProblemEntity>>> {
        // load the full detail graph the `codingProblem` query serves: translations
        // (for localized title/statement), starter code, and testcases
        const problem = await this.entityManager.findOneOrFail(
            CodingProblemEntity,
            {
                where: {
                    id: codingProblemId,
                },
                relations: {
                    translations: true,
                    starterCodes: true,
                    testcases: true,
                },
            },
        )
        const translations = problem.translations ?? []
        // SECURITY: only sample testcases are ever indexed, so hidden testcases
        // never leave Postgres -- the ES document the detail query reads cannot leak them.
        // Reference solutions are likewise NEVER indexed: they are gated behind the
        // reveal flow and must not be served by the `codingProblem` detail read.
        const sampleTestcases = (problem.testcases ?? [])
            .filter((testcase) => testcase.isSample)
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
        return Object.values(Locale).map(
            (locale) => {
                // resolve the localized title + statement for this locale
                const title = this.resolveField(
                    translations,
                    "title",
                    locale,
                    problem.title,
                ).trim()
                const statement = this.resolveField(
                    translations,
                    "statement",
                    locale,
                    problem.statement,
                )
                // populate the FST completion field with the clean title, weighted by
                // display order (earlier problems rank higher) for ranked autocomplete
                const suggest = buildCompletionSuggest({
                    inputs: [title],
                    weight: Math.max(1,
                        100 - (problem.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        new CodingProblemEntity(),
                        {
                            id: problem.id,
                            slug: problem.slug,
                            title,
                            statement,
                            difficulty: problem.difficulty,
                            domain: problem.domain,
                            tags: problem.tags,
                            timeLimitMs: problem.timeLimitMs,
                            memoryLimitKb: problem.memoryLimitKb,
                            points: problem.points,
                            orderIndex: problem.orderIndex,
                            sortIndex: problem.sortIndex,
                            enabled: problem.enabled,
                            starterCodes: problem.starterCodes,
                            testcases: sampleTestcases,
                            suggest,
                        },
                    ),
                }
            },
        )
    }

    /**
     * Build + index the problem across every locale.
     *
     * @param id - Primary-key id of the problem to index.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByCodingProblemId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity({
                entity: CodingProblemEntity,
                data: multilingualEntity.entity,
                locale: multilingualEntity.locale,
            })
        }
    }
}
