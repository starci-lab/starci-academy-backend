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
    ContentIdFactoryService,
} from "./content.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateContentBodyV2IdParams,
} from "./types"

/**
 * SCHEMA V2 per-language content body bucket UUIDs chain from the parent content id string.
 */
@Injectable()
export class ContentBodyV2IdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            langIndex,
        }: GenerateContentBodyV2IdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "content-body-v2",
                this.contentIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                }),
                langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
