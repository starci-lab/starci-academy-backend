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
    GenerateMilestoneIdParams,
} from "./types"

@Injectable()
/**
 * Milestone UUIDs chain from the parent course id string.
 */
export class MilestoneIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params.courseIndex - Parent course ordinal.
     * @param params.milestoneIndex - Milestone ordinal under that course.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            milestoneIndex,
        }: GenerateMilestoneIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                milestoneIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
