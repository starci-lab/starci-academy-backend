import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ModuleIdFactoryService,
} from "./module.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateContentIdParams,
} from "./types"

@Injectable()
/**
 * Content (article) UUIDs nest under the owning {@link ModuleIdFactoryService} id.
 */
export class ContentIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
    ) {}

    /**
     * @param params - Course / module / content ordinals.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: GenerateContentIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "content",
                this.moduleIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                    },
                ),
                contentIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
