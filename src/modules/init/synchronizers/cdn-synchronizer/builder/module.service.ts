import {
    Locale,
    ModuleEntity,
    ModuleHydrationService,
    ModuleResolverService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import _ from "lodash"

@Injectable()
/**
 * Hydrates one module and uploads **per-locale** CDN JSON. Split from the
 * course builder so a single module edit can refresh CDN without rewriting the
 * whole course blob.
 */
export class CdnModuleBuildService {
    constructor(
        private readonly moduleHydration: ModuleHydrationService,
        private readonly moduleResolver: ModuleResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    async buildMultilingualByModuleId(
        moduleId: string,
    ): Promise<Array<LocalizedCdnEntity<ModuleEntity>>> {
        const hydratedModule = await this.moduleHydration.loadById(
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
