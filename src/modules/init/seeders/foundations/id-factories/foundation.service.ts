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
    FoundationCategoryIdFactoryService,
} from "./foundation-category.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateFoundationIdParams,
} from "./types"

@Injectable()
/**
 * Builds deterministic foundation UUIDs chained from the parent category ID.
 */
export class FoundationIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly foundationCategoryIdFactoryService: FoundationCategoryIdFactoryService,
    ) {}

    /**
     * @param params.categoryIndex - Parent category ordinal.
     * @param params.foundationIndex - Foundation ordinal under that category.
     * @returns UUID v5 string.
     */
    generate(
        {
            categoryIndex,
            foundationIndex,
        }: GenerateFoundationIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "foundation",
                this.foundationCategoryIdFactoryService.generate(
                    {
                        categoryIndex,
                    },
                ),
                foundationIndex.toString(),
            ),
            envConfig().uuidNamespace.foundation,
        )
    }
}
