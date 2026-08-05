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
    GenerateCodeImplementationIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic UUIDs for per-lesson code-implementation samples. Same parent
 * chain as explainings ({@link ContentIdFactoryService}) so both stay stable
 * across re-seed without colliding (different hash prefix).
 */
export class CodeImplementationIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            implementationIndex,
        }: GenerateCodeImplementationIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "code-implementation",
                this.contentIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                }),
                implementationIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
