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
    FoundationIdFactoryService,
} from "./foundation.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateFoundationTagIdParams,
} from "./types"

@Injectable()
/**
 * Tag rows on a foundation entity; parent id comes from {@link FoundationIdFactoryService}.
 */
export class FoundationTagIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly foundationIdFactoryService: FoundationIdFactoryService,
    ) {}

    /**
     * @param params - Ordinals down to the tag index.
     * @returns UUID v5 string.
     */
    generate(
        {
            categoryIndex,
            foundationIndex,
            tagIndex,
        }: GenerateFoundationTagIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "foundation-tag",
                this.foundationIdFactoryService.generate({
                    categoryIndex,
                    foundationIndex,
                }),
                tagIndex.toString(),
            ),
            envConfig().uuidNamespace.foundation,
        )
    }
}
