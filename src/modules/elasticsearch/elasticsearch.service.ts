import type {
    Client,
} from "@elastic/elasticsearch"
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectElasticsearch,
} from "./elasticsearch.decorators"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    ConsultantEntity,
    HeadhuntingCompanyEntity,
    Locale,
} from "@modules/databases"
import {
    ObjectLiteral
} from "typeorm"
import {
    AsyncService,
    ReadinessWatcherFactoryService
} from "@modules/mixin"
import {
    configMap
} from "./config"
import {
    resolveElasticsearchIndexPatch,
} from "./patches"
import {
    envConfig,
} from "@modules/env"
import type {
    IndicateNameParams,
    IndexEntityParams,
    IndexEntityResult,
    IndexEntitiesParams,
    IndexEntitiesResult,
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
        LessonVideoEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        FoundationEntity.name,
        FoundationCategoryEntity.name,
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
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
            locale,
        }: IndicateNameParams,
    ): string {
        const config = configMap[entity]
        if (!config) {
            throw new Error(
                `Elasticsearch index config is missing for entity: ${entity}`,
            )
        }
        // avoid generating `-undefined` suffix when locale is omitted
        return locale ? `${config.indices}-${locale}` : config.indices
    }

    /**
     * On application bootstrap, ensure the indices exist. For entities that have an index patch
     * (and when `ELASTICSEARCH_APPLY_INDEX_PATCHES` is on) the per-locale indices are pre-created
     * with the explicit mapping so documents land in a correctly-typed index.
     */
    async onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(
            ElasticsearchService.name
        )
        const applyPatches = envConfig().elasticsearch.applyIndexPatches
        // ensure the indices exist
        await this.asyncService.allIgnoreError(
            this.indices.flatMap(index => {
                // patched entities also pre-create their per-locale indices with the mapping
                const hasPatch = applyPatches && Boolean(resolveElasticsearchIndexPatch(index))
                const locales: Array<Locale | undefined> = hasPatch
                    ? [undefined,
                        ...Object.values(Locale)]
                    : [undefined]
                return locales.map((locale) =>
                    this.ensureIndexForEntity({
                        entity: index,
                        locale,
                    }),
                )
            }),
        )
    }

    /**
     * Ensure the index for an entity (and optional locale) exists, applying its mapping patch when
     * `ELASTICSEARCH_APPLY_INDEX_PATCHES` is on and a patch is registered for the entity. Falls back
     * to Elasticsearch's dynamic mapping when no patch applies.
     *
     * @param params - Entity name and optional locale.
     */
    async ensureIndexForEntity(
        {
            entity,
            locale,
        }: IndicateNameParams,
    ): Promise<void> {
        const index = this.indicateName(
            {
                entity,
                locale,
            },
        )
        const patch = envConfig().elasticsearch.applyIndexPatches
            ? resolveElasticsearchIndexPatch(entity)
            : undefined
        const existsResult = await this.client.indices.exists({
            index,
        })
        const exists =
            typeof existsResult === "boolean"
                ? existsResult
                : (existsResult as { body: boolean }).body
        // missing index → create with the full patch (settings + mappings) or plain when none
        if (!exists) {
            await this.client.indices.create({
                index,
                ...((patch ?? {
                }) as Omit<Parameters<Client["indices"]["create"]>[0], "index">),
            })
            return
        }
        // existing index → ADDITIVELY apply the mapping patch (new fields only) instead of dropping
        // it, so out-of-scope documents are preserved. A type conflict on a pre-existing
        // dynamically-mapped field is ignored so the sync keeps going.
        if (patch?.mappings) {
            try {
                await this.client.indices.putMapping({
                    index,
                    ...(patch.mappings as Omit<Parameters<Client["indices"]["putMapping"]>[0], "index">),
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
            index,
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
            }),
        })
    }

    /**
   * Index the entity.
   */
    async indexEntity<T extends ObjectLiteral>(
        {
            entity,
            data,
            locale,
        }: IndexEntityParams<T>,
    ): Promise<IndexEntityResult> {
        await this.client.index({
            index: this.indicateName(
                {
                    entity: entity.name,
                    locale,
                },
            ),
            id: data.id,
            body: data,
        })
    }
    /**
   * Index the entities.
   */
    async indexEntities<T extends ObjectLiteral>(
        {
            entity,
            data,
            locale,
        }: IndexEntitiesParams<T>,
    ): Promise<IndexEntitiesResult> {
        await this.client.bulk({
            body: data.map((data) => ({
                index: {
                    _index: this.indicateName(
                        {
                            entity: entity.name,
                            locale,
                        },
                    ),
                    _id: data.id,
                },
                document: data,
            })),
        })
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
                    index,
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
