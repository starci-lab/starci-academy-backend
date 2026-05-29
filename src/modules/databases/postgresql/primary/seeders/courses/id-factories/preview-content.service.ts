import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    envConfig,
} from "@modules/env"
import {
    ModuleIdFactoryService,
} from "./module.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GeneratePreviewContentIdParams,
} from "./types"

/**
 * Module teaser bullets; parent id is the module id from {@link ModuleIdFactoryService}.
 */
@Injectable()
export class PreviewContentIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
    ) {}

    /**
     * @param params - Course / module ordinals plus preview bullet index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            previewContentIndex,
        }: GeneratePreviewContentIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "preview-content",
                this.moduleIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                    },
                ),
                previewContentIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
