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
    CourseIdFactoryService,
} from "./course.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateValuePropositionIdParams,
} from "./types"

@Injectable()
/**
 * Landing-page value-prop bullets; scoped to {@link CourseIdFactoryService}.
 */
export class ValuePropositionIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params - Course ordinal and proposition index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            valuePropositionIndex,
        }: GenerateValuePropositionIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "value-proposition",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                valuePropositionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
