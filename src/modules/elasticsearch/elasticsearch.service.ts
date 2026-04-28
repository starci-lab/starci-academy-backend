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
import type {
    IndicateNameParams,
    IndexEntityParams,
    IndexEntityResult,
    IndexEntitiesParams,
    IndexEntitiesResult,
    SearchParams,
    SearchResult,
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
    ]
    constructor(
    @InjectElasticsearch()
    public readonly client: Client,
    private readonly asyncService: AsyncService,
    private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
    ) {}

    /**
     * Indicate the index name.
     * @param entity - Entity to indicate the index name.
     * @returns Index name.
     */
    private indicateName(
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
     * On application bootstrap, ensure the index exists.
     */
    async onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(
            ElasticsearchService.name
        )
        // ensure the indices exist
        await this.asyncService.allIgnoreError(
            this.indices.map(index => {
                return this.ensureIndexExists(
                    this.indicateName(
                        {
                            entity: index,
                        },
                    ),
                )
            }),
        )
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
     * Search the entity.
     */
    async search<T>(
        {
            entityName,
            params,
            locale,
        }: SearchParams,
    ): Promise<SearchResult<T>> {
        const response = await this.client.search(
            {
                index: this.indicateName(
                    {
                        entity: entityName,
                        locale,
                    },
                ),
                from: params.from,
                size: params.size,
                query: params.query || {
                    match_all: {
                    } 
                },
                sort: params.sort,
            }
        )
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as T)
        return {
            data,
            count,
        }
    }
}
