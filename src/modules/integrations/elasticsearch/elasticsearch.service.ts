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
    ObjectLiteral
} from "typeorm"
import {
    ReadinessWatcherFactoryService,
} from "@modules/lib/mixin/readiness-watcher-factory.service"
import {
    ElasticsearchBulkIndexException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-bulk-index"
import {
    ElasticsearchIndexConfigMissingException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-index-config-missing"
import {
    ElasticsearchIndexMappingNotAppliedException,
} from "@modules/platform/exceptions/errors/elasticsearch/elasticsearch-index-mapping-not-applied"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    configMap,
    resolveIndexLocales,
} from "./config"
import {
    resolveElasticsearchIndexMapping
} from "./mappings"
import {
    diffIndexMapping,
} from "./utils/mapping-drift"
import type {
    IndexMappingDrift,
} from "./utils/mapping-drift"
import type {
    EsLegacyBooleanBody,
} from "./types/client"
import type {
    CreateIndexParams,
    DetectMappingDriftParams,
} from "./types/ensure-index"
import type {
    DeleteEntityParams,
    DeleteEntityResult,
} from "./types/delete-entity"
import type {
    IndexEntitiesParams,
    IndexEntitiesResult,
} from "./types/index-entities"
import type {
    IndexEntityParams,
    IndexEntityResult,
} from "./types/index-entity"
import type {
    IndicateNameParams,
} from "./types/indicate-name"
import type {
    CountDocsParams,
    PruneOrphansParams,
} from "./types/prune"

@Injectable()
/**
 * The service for the Elasticsearch.
 */
export class ElasticsearchService implements OnModuleInit {
    /**
     * Entities whose indices are created at boot.
     *
     * Derived from {@link configMap} rather than hand-listed: a hand-maintained list silently
     * skipped `milestones` / `milestone-tasks`, and every index it skips is auto-created by its
     * first document with Elasticsearch dynamic defaults instead of its declared mapping.
     */
    private readonly indices: Array<string> = Object.keys(configMap)
    constructor(
        @InjectElasticsearch()
        public readonly client: Client,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
        private readonly winstonService: WinstonService,
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
     * On application bootstrap, ensure every index declared in {@link configMap} exists WITH its
     * declared mapping -- base index plus one per locale for localized entities.
     *
     * This must run before anything indexes a document: writing to a missing index makes
     * Elasticsearch auto-create it from its dynamic defaults, which turns `keyword` into
     * `text` + `.keyword`, `integer` into `long`, and a `completion` field into a plain object
     * (dead autocomplete). Applying the mapping is NOT optional and is no longer gated by an env
     * flag -- an unmapped index is a broken index.
     */
    async onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(
            ElasticsearchService.name
        )
        // ensure every declared index (entity x locale) exists with its declared mapping.
        // Sequential on purpose: this is boot-time bookkeeping over ~30 indices, and firing every
        // exists/getMapping/create at once only buries the cluster under connections it does not
        // need to hold while the rest of the application is still starting.
        for (const entity of this.indices) {
            for (const locale of resolveIndexLocales(entity)) {
                await this.ensureIndexForEntity({
                    entity,
                    locale,
                })
            }
        }
    }

    /**
     * Ensure the index for an entity (and optional locale) exists and carries its declared mapping.
     *
     * A missing index is created from the mapping registered for the entity (dynamic mapping only
     * when the entity has none). An index that already exists is compared against the declaration:
     *
     * - no drift -> nothing to do;
     * - drift on an EMPTY index -> dropped and recreated from the declaration (nothing to lose);
     * - drift on a POPULATED index -> reported at error level and left alone. Elasticsearch cannot
     *   retype a field that already exists, so the only honest repair is drop + repopulate from
     *   Postgres, which is what {@link ElasticsearchIndexResetService} does when `seed.yaml`
     *   `sync.reindex` names the index. Boot refuses to make that call on its own, because it
     *   would silently destroy documents the operator never asked to lose.
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
        const mapping = resolveElasticsearchIndexMapping(entity)
        // missing index -> create with the full mapping (settings + mappings) or plain when none
        if (!(await this.indexExists(index))) {
            await this.createIndex({
                index,
                entity,
                mapping,
            })
            return
        }
        // nothing declared -> nothing to compare against, dynamic mapping is the contract
        if (!mapping?.mappings) {
            return
        }
        const drifts = await this.detectMappingDrift({
            index,
            mapping: mapping.mappings,
        })
        if (drifts.length === 0) {
            return
        }
        const documentCount = await this.countDocs({
            entity,
            locale,
        })
        // loud, never swallowed: this is the failure that silently disables autocomplete and
        // makes every sort/aggregation on a declared keyword field blow up at query time
        this.winstonService.log(
            WinstonLog.ElasticsearchIndexMappingDrifted,
            {
                index,
                documentCount,
                drifts: drifts.map(
                    (drift) => `${drift.field}: ${drift.declared} -> ${drift.live}`,
                ),
            },
        )
        // documents at risk -> leave the index alone; the operator drives the reindex
        if (documentCount > 0) {
            return
        }
        // empty index -> nothing to lose, rebuild it from the declaration right now
        await this.deleteIndex(index)
        await this.createIndex({
            index,
            entity,
            mapping,
        })
        this.winstonService.log(
            WinstonLog.ElasticsearchIndexMappingRepaired,
            {
                index,
                documentCount,
            },
        )
    }

    /**
   * Ensure the index exists.
   */
    async ensureIndexExists(
        index: string,
        create?: Omit<Parameters<Client["indices"]["create"]>[0], "index">,
    ): Promise<void> {
        if (await this.indexExists(index)) return

        await this.client.indices.create({
            index,
            ...(create ?? {
            })
        })
    }

    /**
     * Check whether an index exists, normalising the boolean/`{ body }` shapes the client returns
     * across transport versions.
     *
     * @param index - Concrete index name.
     * @returns True when the index exists.
     */
    private async indexExists(
        index: string,
    ): Promise<boolean> {
        const existsResult = await this.client.indices.exists({
            index
        })
        return typeof existsResult === "boolean"
            ? existsResult
            : (existsResult as EsLegacyBooleanBody).body
    }

    /**
     * Create an index from its declared mapping, failing loudly when the mapping cannot be applied.
     *
     * A swallowed create is exactly how an index ends up fully dynamic: the create fails, the first
     * indexed document auto-creates the index instead, and every declared type is lost.
     *
     * @param params - Index name, owning entity, and the mapping to apply.
     */
    private async createIndex(
        {
            index,
            entity,
            mapping,
        }: CreateIndexParams,
    ): Promise<void> {
        try {
            await this.client.indices.create({
                index,
                ...((mapping ?? {
                }) as Omit<Parameters<Client["indices"]["create"]>[0], "index">)
            })
        } catch (error) {
            // another boot worker won the race and created the same index -> the index exists
            // with the same declared mapping, which is the desired end state
            if (
                error?.meta?.body?.error?.type === "resource_already_exists_exception" ||
                error?.message?.includes("resource_already_exists_exception")
            ) {
                return
            }
            throw new ElasticsearchIndexMappingNotAppliedException({
                index,
                entity,
                originalError: error instanceof Error ? error : undefined,
            })
        }
    }

    /**
     * Compare a live index mapping against the mapping the code declares for it.
     *
     * @param params - Index name and the declared `mappings` block.
     * @returns One entry per declared field whose live definition differs.
     */
    private async detectMappingDrift(
        {
            index,
            mapping,
        }: DetectMappingDriftParams,
    ): Promise<Array<IndexMappingDrift>> {
        const response = await this.client.indices.getMapping({
            index,
        })
        // the response is keyed by concrete index name; an alias would resolve to one entry
        const live = response[index]?.mappings as Record<string, unknown> | undefined
        return diffIndexMapping({
            declared: mapping,
            live,
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
        // Nothing to index -> skip. An empty bulk body is rejected by ES with
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
        // valid operations -> `no requests added`. flatMap pairs action + source.
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
     * as success -- the desired end-state (doc gone) already holds.
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
            // doc already absent (404) -> desired state reached, nothing to do
            if (
                error?.meta?.statusCode === 404 ||
                error?.meta?.body?.result === "not_found"
            ) {
                return
            }
            // index never created yet -> nothing to delete
            if (
                error?.meta?.body?.error?.type === "index_not_found_exception" ||
                error?.message?.includes("index_not_found_exception")
            ) {
                return
            }
            // any other failure is real -> surface it to the caller
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
     * This prunes orphans left behind by the append-only indexer -- docs for
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
            // when there are zero desired ids the whole index is orphaned -> match everything;
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
            // `deleted` is optional in the response typing -> default to 0
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
