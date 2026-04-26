import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ModuleEntity,
    ModuleResolverService,
    PreviewContentEntity,
} from "@modules/databases"
import {
    ModuleNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"

/**
 * Loads a module (with preview contents) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ModuleResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchModulesBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleResolver: ModuleResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed module tree.
     */
    async buildMultilingualByModuleId(
        moduleId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ModuleEntity>>> {
        const hydratedModule = await this.loadHydratedModulePlain(
            moduleId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                this.moduleResolver.transform(
                    hydratedModule,
                    locale,
                )
                return {
                    locale,
                    entity: hydratedModule,
                }
            },
        )
    }

    /**
     * Loads the hydrated module plain object from PostgreSQL.
     * @param id - The module id.
     * @returns The hydrated module plain object.
     */
    private async loadHydratedModulePlain(
        id: string,
    ): Promise<ModuleEntity> {
        const moduleRow = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!moduleRow) {
            throw new ModuleNotFoundException(
                {
                    id,
                }
            )
        }
        const hydratedModule = moduleRow.toPlain<ModuleEntity>()
        const previewContents = await this.entityManager.find(
            PreviewContentEntity,
            {
                where: {
                    module: {
                        id: hydratedModule.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        hydratedModule.previewContents = previewContents.map(
            (
                previewContent,
            ) => previewContent.toPlain<PreviewContentEntity>()
        )
        return hydratedModule
    }

    /**
     * Builds the index by module id.
     * @param id - The module id.
     * @returns The index by module id.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByModuleId(id)
        const entities = multilingualEntities.map(
            (
                multilingualEntity,
            ) => ({
                ...multilingualEntity.entity,
                elasticsearchLocale: multilingualEntity.locale,
            })
        )
        await this.elasticsearchService.indexEntities(
            ModuleEntity,
            entities
        )
    }
}