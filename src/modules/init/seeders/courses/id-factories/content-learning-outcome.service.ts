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
    GenerateContentLearningOutcomeIdParams,
} from "./types"

/**
 * Content learning-outcome ("what you will learn" bullet) UUIDs chain from the parent content id.
 * Position-based (ordinals only) so re-seeding the same bullet keeps a stable id → upsert updates.
 */
@Injectable()
export class ContentLearningOutcomeIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    /**
     * @param params - Course / module / content ordinals + outcome bullet ordinal.
     * @returns UUID v5 string deterministic for this content + outcome position.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            orderIndex,
        }: GenerateContentLearningOutcomeIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "content-learning-outcome",
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
