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

export interface GenerateCodeExplainingIdParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    explainingIndex: number
}

@Injectable()
export class CodeExplainingIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            explainingIndex,
        }: GenerateCodeExplainingIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "code-explaining",
                this.contentIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                }),
                explainingIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
