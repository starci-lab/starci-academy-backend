import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
    OnApplicationBootstrap,
} from "@nestjs/common"
import {
    EntityManager,
    ObjectLiteral,
} from "typeorm"

/**
 * Base class for syncing entities into Elasticsearch indices.
 *
 * Strategy: periodically fetch entities (with relations), then bulk index using `_id = entity.id`.
 */
@Injectable()
export abstract class BaseElasticsearchSyncService<
    T extends ObjectLiteral & { id: string; toPlain?: () => any }
> implements OnApplicationBootstrap {
    private isSyncing = false

    constructor(
        protected readonly elasticsearchService: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        protected readonly entityManager: EntityManager,
    ) {}

    /** TypeORM entity class. */
    protected abstract get entityType(): { new (): T }

    /** Elasticsearch index name. */
    protected abstract get indexName(): string

    /** Relations to hydrate before indexing. */
    protected abstract get relations(): string[] | any

    async onApplicationBootstrap() {
        // Fire-and-forget initial sync (interval will keep it fresh).
        void this.syncAll()
    }

    protected async ensureIndex() {
        const client = this.elasticsearchService.raw
        const exists = await client.indices.exists({
            index: this.indexName,
        })
        // In client v8, exists.body is boolean; in newer, returns boolean directly.
        const ok = typeof exists === "boolean"
            ? exists
            : (exists as { body: boolean }).body
        if (ok) return

        await client.indices.create({
            index: this.indexName,
        })
    }

    public async syncAll() {
        if (this.isSyncing) return
        this.isSyncing = true
        try {
            await this.ensureIndex()

            const entities = await this.entityManager.find(this.entityType, {
                relations: this.relations,
                order: {
                    id: "ASC",
                } as any,
            })

            if (entities.length === 0) return

            const ops: Array<Record<string, any>> = []
            for (const entity of entities) {
                const doc = entity.toPlain ? entity.toPlain() : entity
                ops.push({
                    index: {
                        _index: this.indexName,
                        _id: entity.id,
                    },
                })
                ops.push(doc)
            }

            await this.elasticsearchService.raw.bulk({
                refresh: false,
                operations: ops,
            })
        } finally {
            this.isSyncing = false
        }
    }
}

