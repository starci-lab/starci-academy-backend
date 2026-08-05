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
    GenerateContentBodyIdParams,
} from "./types"

@Injectable()
/**
 * SCHEMA V2 per-language content body bucket UUIDs chain from the parent content id string.
 */
export class ContentBodyIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    /**
     * @param params - Course / module / content ordinals + body folder ordinal.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            orderIndex,
        }: GenerateContentBodyIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "content-body",
                this.contentIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                }),
                orderIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
