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
    MilestoneTaskIdFactoryService,
} from "./milestone-task.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMilestoneTaskApproachCriteriaIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic ids for SCHEMA V2 milestone-task APPROACH criteria (per-language prose differs
 * across brief blocks); chains from the parent milestone-task id string for idempotent re-seed.
 */
export class MilestoneTaskApproachCriteriaIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            milestoneIndex,
            taskIndex,
            criterionIndex,
        }: GenerateMilestoneTaskApproachCriteriaIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-approach-criteria",
                this.milestoneTaskIdFactoryService.generate(
                    {
                        courseIndex,
                        milestoneIndex,
                        taskIndex,
                    },
                ),
                criterionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
