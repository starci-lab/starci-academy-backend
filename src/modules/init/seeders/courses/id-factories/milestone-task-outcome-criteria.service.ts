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
    GenerateMilestoneTaskOutcomeCriteriaIdParams,
} from "./types"

/**
 * Deterministic ids for SCHEMA V2 milestone-task OUTCOME criteria (agnostic across the per-language
 * brief blocks); chains from the parent milestone-task id string for idempotent re-seed.
 */
@Injectable()
export class MilestoneTaskOutcomeCriteriaIdFactoryService {
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
        }: GenerateMilestoneTaskOutcomeCriteriaIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-outcome-criteria",
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
