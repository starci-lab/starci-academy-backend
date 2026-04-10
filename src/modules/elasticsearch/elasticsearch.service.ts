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
    LessonVideoEntity
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
    SearchParam 
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
    private indicateName(entity: string) {
        return configMap[entity].indices
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
                return this.ensureIndexExists(this.indicateName(index))
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
    async indexEntity<T extends ObjectLiteral>(entity: T, data: ObjectLiteral, docId?: string) {
        await this.client.index({
            index: this.indicateName(entity.name),
            id: docId ?? data.id,
            body: data,
        })
    }

    /**
   * Index the entities.
   */
    async indexEntities<T extends ObjectLiteral>(
        entity: T,
        data: Array<ObjectLiteral>,
    ) {
        await this.client.bulk({
            body: data.map((data) => ({
                index: {
                    _index: this.indicateName(entity.name),
                    _id: data.id,
                },
                document: data,
            })),
        })
    }

    async search<T>(
        entityName: string, 
        params: SearchParam
    ) {
        const response = await this.client.search({
            index: this.indicateName(entityName),
            from: params.from,
            size: params.size,
            query: params.query || {
                match_all: {
                } 
            },
            sort: params.sort,
        })

        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0

        const data = response.hits.hits.map((hit) => hit._source as T)
    
        return {
            data,
            count,
        }
    }
}
