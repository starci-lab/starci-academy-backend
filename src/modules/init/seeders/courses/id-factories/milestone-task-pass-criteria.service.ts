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
    GenerateMilestoneTaskPassCriteriaIdParams,
} from "./types"

/**
 * Milestone task pass criteria UUIDs chain from the parent milestone task id string.
 */
@Injectable()
export class MilestoneTaskPassCriteriaIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            milestoneIndex,
            taskIndex,
            criteriaIndex,
        }: GenerateMilestoneTaskPassCriteriaIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-pass-criteria",
                this.milestoneTaskIdFactoryService.generate(
                    {
                        courseIndex,
                        milestoneIndex,
                        taskIndex,
                    },
                ),
                criteriaIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
