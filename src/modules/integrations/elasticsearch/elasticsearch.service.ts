import type {
    Client
} from "@elastic/elasticsearch"
import {
    Injectable,
    OnModuleInit
} from "@nestjs/common"
import {
    InjectElasticsearch
} from "./elasticsearch.decorators"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    ConsultantEntity,
    HeadhuntingCompanyEntity,
    FlashcardDeckEntity,
    CodingProblemEntity,
    Locale
} from "@modules/databases"
import {
    ObjectLiteral
} from "typeorm"
import {
    AsyncService,
    ReadinessWatcherFactoryService
} from "@modules/mixin"
import {
    ElasticsearchBulkIndexException,
    ElasticsearchIndexConfigMissingException,
} from "@modules/exceptions"
import {
    configMap
} from "./config"
import {
    resolveElasticsearchIndexMapping
} from "./mappings"
import {
    envConfig
} from "@modules/env"
import type {
    IndicateNameParams,
    IndexEntityParams,
    IndexEntityResult,
    IndexEntitiesParams,
    IndexEntitiesResult,
    CountDocsParams,
    PruneOrphansParams,
    DeleteEntityParams,
    DeleteEntityResult
} from "./types"

/**
 * The service for the Elasticsearch.
 */
@Injectable()
export class ElasticsearchService implements OnModuleInit {
    /**
     * The indices to create.
     */
    private readonly indices: Array<string> = [
        CourseEntity.name,

        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        FoundationEntity.name,
        FoundationCategoryEntity.name,
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
        FlashcardDeckEntity.name,
        CodingProblemEntity.name,
    ]
    constructor(
        @InjectElasticsearch()
        public readonly client: Client,
        private readonly asyncService: AsyncService,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
    ) { }

    /**
     * Indicate the index name.
     * @param entity - Entity to indicate the index name.
     * @returns Index name.
     */
    public indicateName(
        {
            entity,
            locale
        }: IndicateNameParams,
    ): string {
        const config = configMap[entity]
        if (!config) {
            throw new ElasticsearchIndexConfigMissingException({
                entity: String(entity),
            })
        }
        // avoid generating `-undefined` suffix when locale is omitted
        return locale ? `${config.indices}-${locale}` : config.indices
    }

    /**
     * On application bootstrap, ensure the indices exist. For entities that have an explicit index
     * mapping (and when `ELASTICSEARCH_APPLY_INDEX_MAPPINGS` is on) the per-locale indices are
     * pre-created with that mapping so documents land in a correctly-typed index.
     */
    async onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(
            ElasticsearchService.name
        )
        const applyMappings = envConfig().elasticsearch.applyIndexMappings
        // ensure the indices exist
        await this.asyncService.allMustDone(
            this.indices.flatMap(index => {
                // mapped entities also pre-create their per-locale indices with the mapping
                const hasMapping = applyMappings && Boolean(resolveElasticsearchIndexMapping(index))
                const locales: Array<Locale | undefined> = hasMapping
                    ? [undefined,
                        ...Object.values(Locale)]
                    : [undefined]
                return locales.map((locale) =>
                    this.ensureIndexForEntity({
                        entity: index,
                        locale
                    }),
                )
            }),
        )
    }

    /**
     * Ensure the index for an entity (and optional locale) exists, applying its explicit index
     * mapping when `ELASTICSEARCH_APPLY_INDEX_MAPPINGS` is on and a mapping is registered for the
     * entity. Falls back to Elasticsearch's dynamic mapping when no mapping applies.
     *
     * @param params - Entity name and optional locale.
     */
    async ensureIndexForEntity(
        {
            entity,
            locale
        }: IndicateNameParams,
    ): Promise<void> {
        const index = this.indicateName(
            {
                entity,
                locale
            },
        )
        const mapping = envConfig().elasticsearch.applyIndexMappings
            ? resolveElasticsearchIndexMapping(entity)
            : undefined
        const existsResult = await this.client.indices.exists({
            index
        })
        const exists =
            typeof existsResult === "boolean"
                ? existsResult
                : (existsResult as { body: boolean }).body
        // missing index → create with the full mapping (settings + mappings) or plain when none
        if (!exists) {
            await this.client.indices.create({
                index,
                ...((mapping ?? {
                }) as Omit<Parameters<Client["indices"]["create"]>[0], "index">)
            })
            return
        }
        // existing index → ADDITIVELY apply the mapping (new fields only) instead of dropping
        // it, so out-of-scope documents are preserved. A type conflict on a pre-existing
        // dynamically-mapped field is ignored so the sync keeps going.
        if (mapping?.mappings) {
            try {
                await this.client.indices.putMapping({
                    index,
                    ...(mapping.mappings as Omit<Parameters<Client["indices"]["putMapping"]>[0], "index">)
                })
            } catch {
                // ignore mapping conflicts on pre-existing fields
            }
        }
    }

    /**
   * Ensure the index exists.
   */
    async ensureIndexExists(
        index: string,
        create?: Omit<Parameters<Client["indices"]["create"]>[0], "index">,
    ): Promise<void> {
        const existsResult = await this.client.indices.exists({
            index
        })
        const exists =
            typeof existsResult === "boolean"
                ? existsResult
                : (
                    existsResult as {
                        body: boolean;
                    }
                ).body

        if (exists) return

        await this.client.indices.create({
            index,
            ...(create ?? {
            })
        })
    }

    /**
   * Index the entity.
   */
    async indexEntity<T extends ObjectLiteral>(
        {
            entity,
            data,
            locale
        }: IndexEntityParams<T>,
    ): Promise<IndexEntityResult> {
        await this.client.index({
            index: this.indicateName(
                {
                    entity: entity.name,
                    locale
                },
            ),
            id: data.id,
            body: data
        })
    }
    /**
   * Index the entities.
   */
    async indexEntities<T extends ObjectLiteral>(
        {
            entity,
            data,
            locale
        }: IndexEntitiesParams<T>,
    ): Promise<IndexEntitiesResult> {
        // Nothing to index → skip. An empty bulk body is rejected by ES with
        // `action_request_validation_exception: no requests added`.
        if (data.length === 0) {
            return
        }
        // Same index for every doc in this call (one entity + locale).
        const index = this.indicateName(
            {
                entity: entity.name,
                locale,
            },
        )
        // The bulk API needs a FLATTENED action/source stream: each doc is an
        // `index` action line IMMEDIATELY followed by its source line. Emitting
        // one `{ index, document }` object per item (the old shape) yields zero
        // valid operations → `no requests added`. flatMap pairs action + source.
        const result = await this.client.bulk({
            refresh: true,
            operations: data.flatMap((document) => [
                {
                    index: {
                        _index: index,
                        _id: document.id,
                    },
                },
                document,
            ]),
        })
        // Surface per-item failures instead of silently leaving the index partial.
        if (result.errors) {
            const firstError = result.items.find((item) => item.index?.error)?.index?.error
            throw new ElasticsearchBulkIndexException({
                index,
                firstError,
            })
        }
    }

    /**
     * Delete a single document by id from a (per-locale) index.
     *
     * Used by event-driven sync paths to drop a doc when its source row is
     * removed or soft-deleted. A missing document (or absent index) is treated
     * as success — the desired end-state (doc gone) already holds.
     *
     * @param params - Entity class name, doc id, and optional locale.
     *
     * @example
     * await service.deleteEntity({ entity: UserEntity.name, id })
     */
    async deleteEntity(
        {
            entity,
            id,
            locale,
        }: DeleteEntityParams,
    ): Promise<DeleteEntityResult> {
        // resolve the concrete index name (`<base>` or `<base>-<locale>`)
        const index = this.indicateName({
            entity,
            locale,
        })
        try {
            // delete the doc by its _id; refresh so a follow-up read sees it gone
            await this.client.delete({
                index,
                id,
                refresh: true,
            })
        } catch (error) {
            // doc already absent (404) → desired state reached, nothing to do
            if (
                error?.meta?.statusCode === 404 ||
                error?.meta?.body?.result === "not_found"
            ) {
                return
            }
            // index never created yet → nothing to delete
            if (
                error?.meta?.body?.error?.type === "index_not_found_exception" ||
                error?.message?.includes("index_not_found_exception")
            ) {
                return
            }
            // any other failure is real → surface it to the caller
            throw error
        }
    }

    /**
     * Count the documents currently stored in a per-locale index.
     *
     * Used by the synchronizer reconcile pass to size the diff between what the
     * index holds and what the database says should exist.
     *
     * @param params - Entity class name + locale selecting the index.
     * @returns Document count, or 0 when the index does not exist yet.
     *
     * @example
     * await service.countDocs({ entity: CourseEntity.name, locale: Locale.Vi })
     */
    async countDocs(
        {
            entity,
            locale,
        }: CountDocsParams,
    ): Promise<number> {
        // resolve the concrete `<base>-<locale>` index to count
        const index = this.indicateName({
            entity,
            locale,
        })
        try {
            // ask ES for the live document count of that index
            const result = await this.client.count({
                index,
            })
            return result.count
        } catch (error) {
            // a not-yet-created index simply has zero documents
            if (
                error?.meta?.body?.error?.type === "index_not_found_exception" ||
                error?.message?.includes("index_not_found_exception")
            ) {
                return 0
            }
            throw error
        }
    }

    /**
     * Delete every document in a per-locale index whose id is NOT in `ids`.
     *
     * This prunes orphans left behind by the append-only indexer — docs for
     * entities that were removed/renamed in the database but never cleaned up.
     *
     * @param params - Entity class name, locale, and the doc ids to keep.
     * @returns Number of documents actually deleted (0 when index is absent).
     *
     * @example
     * await service.pruneOrphans({ entity: CourseEntity.name, locale: Locale.Vi, ids: liveIds })
     */
    async pruneOrphans(
        {
            entity,
            locale,
            ids,
        }: PruneOrphansParams,
    ): Promise<number> {
        // resolve the concrete `<base>-<locale>` index to prune
        const index = this.indicateName({
            entity,
            locale,
        })
        try {
            // when there are zero desired ids the whole index is orphaned → match everything;
            // otherwise delete every doc whose _id is not in the keep-list
            const result = await this.client.deleteByQuery({
                index,
                // keep deleting past version conflicts instead of aborting the whole pass
                conflicts: "proceed",
                // make deletions immediately visible so a follow-up count reflects reality
                refresh: true,
                query: ids.length > 0
                    ? {
                        bool: {
                            must_not: [
                                {
                                    ids: {
                                        values: ids,
                                    },
                                },
                            ],
                        },
                    }
                    : {
                        match_all: {
                        },
                    },
            })
            // `deleted` is optional in the response typing → default to 0
            return result.deleted ?? 0
        } catch (error) {
            // nothing to prune if the index was never created
            if (
                error?.meta?.body?.error?.type === "index_not_found_exception" ||
                error?.message?.includes("index_not_found_exception")
            ) {
                return 0
            }
            throw error
        }
    }

    /**
     * Delete the index.
     */
    async deleteIndex(
        index: string,
    ): Promise<void> {
        try {
            await this.client.indices.delete(
                {
                    index
                },
            )
        } catch (error) {
            // Silently ignore if the index does not exist
            if (
                error?.meta?.body?.error?.type === "index_not_found_exception" ||
                error?.message?.includes("index_not_found_exception")
            ) {
                return
            }
            throw error
        }
    }
}
