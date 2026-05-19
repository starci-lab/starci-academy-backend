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
    FoundationCategoryIdFactoryService,
} from "./foundation-category.service"
import {
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link FoundationIdFactoryService.generate}.
 */
export interface GenerateFoundationIdParams {
    /**
     * Zero-based category index (same as {@link GenerateFoundationCategoryIdParams.categoryIndex}).
     */
    categoryIndex: number
    /**
     * Zero-based foundation index within that category.
     */
    foundationIndex: number
}

/**
 * Builds deterministic foundation UUIDs chained from the parent category ID.
 */
@Injectable()
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
