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
    MilestoneIdFactoryService,
} from "./milestone.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMilestoneTaskIdParams,
} from "./types"

@Injectable()
/**
 * Milestone task UUIDs chain from the parent milestone id string.
 */
export class MilestoneTaskIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneIdFactoryService: MilestoneIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            milestoneIndex,
            taskIndex,
        }: GenerateMilestoneTaskIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task",
                this.milestoneIdFactoryService.generate(
                    {
                        courseIndex,
                        milestoneIndex,
                    },
                ),
                taskIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
