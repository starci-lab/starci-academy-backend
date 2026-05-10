import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ModuleEntity,
    ModuleResolverService,
    PreviewContentEntity,
    ContentEntity,
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
import _ from "lodash"

/**
 * Loads a module (with preview contents and contents) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ModuleResolverService`) for Elasticsearch JSON.
 */
@Injectable()
export class ElasticsearchModuleBuildService {
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
                const localizedModule = _.cloneDeep(hydratedModule)
                this.moduleResolver.transform(
                    localizedModule,
                    locale,
                )
                return {
                    locale,
                    entity: localizedModule,
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
        const contents = await this.entityManager.find(
            ContentEntity,
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
        hydratedModule.contents = contents.map(
            (
                content,
            ) => content.toPlain<ContentEntity>()
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
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: ModuleEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}