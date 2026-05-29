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
    GeneratePricingPhaseIdParams,
} from "./types"

/**
 * Pricing-phase rows on a course; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
export class PricingPhaseIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params - Course ordinal and phase slot index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            phaseIndex,
        }: GeneratePricingPhaseIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "pricing-phase",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                phaseIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
