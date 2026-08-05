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
    MilestoneTaskIdFactoryService,
} from "./milestone-task.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMilestoneTaskCodeImplementationIdParams,
} from "./types"

@Injectable()
/**
 * Milestone task code-implementation UUIDs chain from the parent milestone task id string.
 */
export class MilestoneTaskCodeImplementationIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            milestoneIndex,
            taskIndex,
            implementationIndex,
        }: GenerateMilestoneTaskCodeImplementationIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-code-implementation",
                this.milestoneTaskIdFactoryService.generate(
                    {
                        courseIndex,
                        milestoneIndex,
                        taskIndex,
                    },
                ),
                implementationIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
