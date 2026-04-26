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
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"

/**
 * Loads a module (with preview contents) from PostgreSQL and materializes **per-locale** plain objects
 * (after `ModuleResolverService`) for CDN JSON.
 */
@Injectable()
export class CdnModuleBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleResolver: ModuleResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed module tree.
     */
    async buildMultilingualByModuleId(
        moduleId: string,
    ): Promise<Array<LocalizedCdnEntity<ModuleEntity>>> {
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
     * Materialize and upload the modules to the CDN.
     * @param moduleId - The module id to materialize and upload.
     */
    async materializeAndUpload(
        moduleId: string,
    ): Promise<void> {
        const modules = await this.buildMultilingualByModuleId(
            moduleId,
        )
        await this.materializeAndUploadService.process(
            modules,
            (
                id,
                locale,
            ) => this.s3NameResolverService.module(
                id,
                locale,
            ),
        )
    }
}
