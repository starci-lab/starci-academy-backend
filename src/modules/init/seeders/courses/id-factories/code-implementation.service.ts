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
