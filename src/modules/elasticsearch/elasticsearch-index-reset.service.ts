import type {
    Client,
} from "@elastic/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    AsyncService,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    configMap,
} from "./config"
import {
    ElasticsearchService,
} from "./elasticsearch.service"

/**
 * Resets Elasticsearch indices on demand.
 *
 * {@link resetAllIndices} DROPS every entity index (base + per-locale) and re-creates it from its
 * `configMap` mapping, giving a clean, correctly-typed index for mixed V1/V2 documents (legacy
 * `body` and SCHEMA V2 `bodies`/`isPremium`/`verified` share one record/index).
 *
 * Destructive by design — called by the synchronizer phase only when `seed.yaml`
 * `synchronizers.reIndex` is true, right before the data is repopulated.
 */
@Injectable()
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
        // reset base + every locale variant of each configured entity in parallel
        const locales: Array<Locale | undefined> = [
            undefined,
            ...Object.values(Locale),
        ]
        const tasks = Object.keys(configMap).flatMap((entity) =>
            locales.map((locale) => ({
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
        // re-create with the explicit V1+V2 mapping from config, or plain when none is set
        const mapping = configMap[entity]?.mapping
        await this.elasticsearchService.client.indices.create({
            index,
            ...((mapping ?? {
            }) as Omit<
                Parameters<Client["indices"]["create"]>[0],
                "index"
            >),
        })
    }
}
