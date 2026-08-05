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
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateFoundationCategoryIdParams,
} from "./types"

@Injectable()
/**
 * Builds deterministic foundation category UUIDs using SHA-256 + UUID v5.
 */
export class FoundationCategoryIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) {}

    /**
     * Produces a stable foundation category UUID for the given ordinal index.
     */
    generate(
        {
            categoryIndex,
        }: GenerateFoundationCategoryIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "foundation_category",
                categoryIndex.toString(),
            ),
            envConfig().uuidNamespace.foundation,
        )
    }
}
