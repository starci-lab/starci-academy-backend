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

/**
 * Input for {@link ContentIdFactoryService["generate"]}.
 */
export interface GenerateContentIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based content slot under `modules/{moduleIndex}/contents/{contentIndex}`. */
    contentIndex: number
}

/**
 * Content (article) UUIDs nest under the owning {@link ModuleIdFactoryService} id.
 */
@Injectable()
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
