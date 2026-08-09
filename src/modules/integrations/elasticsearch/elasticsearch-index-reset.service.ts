import {
    Injectable,
} from "@nestjs/common"
import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AsyncService,
} from "@modules/lib/mixin/async.service"
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
    ElasticsearchService,
} from "./elasticsearch.service"

@Injectable()
/**
 * Resets Elasticsearch indices on demand.
 *
 * {@link resetAllIndices} DROPS every entity index (base + per-locale) and re-creates it from its
 * `configMap` mapping, giving a clean, correctly-typed index for mixed V1/V2 documents (legacy
 * `body` and SCHEMA V2 `bodies`/`isPremium`/`verified` share one record/index).
 *
 * Destructive by design -- called by the synchronizer phase for the entities listed
 * in `seed.yaml` `sync.reindex`, right before that data is repopulated.
 */
export class ElasticsearchIndexResetService {
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        private readonly asyncService: AsyncService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Drop + re-create all entity indices (base + every locale variant) from config.
     * Destructive: every existing document is lost and must be repopulated afterwards.
     */
    async resetAllIndices(): Promise<void> {
        await this.resetIndices(Object.keys(configMap))
    }

    /**
     * Drop + re-create the given entity indices (base + every locale variant) from config.
     * Destructive: their documents are lost and must be repopulated by the sync that follows.
     *
     * @param entities - Entity class names (keys into {@link configMap}); unknown keys are skipped.
     */
    async resetIndices(entities: Array<string>): Promise<void> {
        // only reset entities that actually have a configured index
        const known = entities.filter((entity) => entity in configMap)
        if (known.length === 0) {
            return
        }
        // reset every concrete index each entity owns (base + its locale variants) in parallel
        const tasks = known.flatMap((entity) =>
            resolveIndexLocales(entity).map((locale) => ({
                entity,
                locale,
            })),
        )
        this.winstonService.log(
            WinstonLog.ElasticsearchIndexResetStarted,
            {
                indexCount: tasks.length,
            },
        )
        await this.asyncService.allMustDone(
            tasks.map(({ entity, locale }) =>
                this.resetIndex(
                    entity,
                    locale,
                ),
            ),
        )
        this.winstonService.log(
            WinstonLog.ElasticsearchIndexResetDone,
            {
                indexCount: tasks.length,
            },
        )
    }

    /**
     * Drop a single `<base>[-<locale>]` index and re-create it from the entity's config mapping
     * (falls back to dynamic mapping when the entity has none).
     * @param entity - Entity class name (key into {@link configMap}).
     * @param locale - Optional locale selecting the per-locale index.
     */
    private async resetIndex(
        entity: string,
        locale?: Locale,
    ): Promise<void> {
        const index = this.elasticsearchService.indicateName({
            entity,
            locale,
        })
        // drop first (no-op when the index does not exist)
        await this.elasticsearchService.deleteIndex(index)
        // re-create through the shared ensure path so the declared mapping is applied and any
        // failure to apply it throws instead of leaving an index to be auto-created dynamically
        await this.elasticsearchService.ensureIndexForEntity({
            entity,
            locale,
        })
    }
}
