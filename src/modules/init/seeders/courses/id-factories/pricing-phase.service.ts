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
    CourseIdFactoryService,
} from "./course.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GeneratePricingPhaseIdParams,
} from "./types"

@Injectable()
/**
 * Pricing-phase rows on a course; parent id is {@link CourseIdFactoryService}.
 */
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
