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
    GenerateTemplateCvIdParams,
} from "./types"

@Injectable()
/**
 * Template CV UUIDs: SHA-256 over typed preimage segments, then UUID v5 under {@link envConfig} `uuidNamespace.course`.
 */
export class TemplateCvIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) { }

    /**
     * @param params - Mount template key.
     * @returns UUID v5 string.
     */
    generate(
        {
            key,
        }: GenerateTemplateCvIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "template-cv",
                key,
            ),
            envConfig().uuidNamespace.templateCV,
        )
    }
}
