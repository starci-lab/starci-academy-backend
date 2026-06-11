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
    GenerateMilestoneTaskBriefIdParams,
} from "./types"

/**
 * Deterministic ids for SCHEMA V2 per-language milestone-task briefs; chains from the parent
 * milestone-task id string so a task move re-derives its brief ids for idempotent re-seed.
 */
@Injectable()
export class MilestoneTaskBriefIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskIdFactoryService: MilestoneTaskIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            milestoneIndex,
            taskIndex,
            briefIndex,
        }: GenerateMilestoneTaskBriefIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-brief",
                this.milestoneTaskIdFactoryService.generate(
                    {
                        courseIndex,
                        milestoneIndex,
                        taskIndex,
                    },
                ),
                briefIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
