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
    GenerateContentReferenceIdParams,
} from "./types"

/**
 * External link rows on a content entity; parent id comes from {@link ContentIdFactoryService}.
 */
@Injectable()
export class ContentReferenceIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    /**
     * @param params - Ordinals down to the reference index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            referenceIndex,
        }: GenerateContentReferenceIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "content-reference",
                this.contentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    },
                ),
                referenceIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
