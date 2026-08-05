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
    MilestoneTaskApproachCriteriaIdFactoryService,
} from "./milestone-task-approach-criteria.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMilestoneTaskApproachCriteriaLangIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic ids for the per-language prose rows under a SCHEMA V2 milestone-task APPROACH
 * criterion; chains from the parent approach-criterion id string for idempotent re-seed.
 */
export class MilestoneTaskApproachCriteriaLangIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskApproachCriteriaIdFactoryService: MilestoneTaskApproachCriteriaIdFactoryService,
    ) {}

    generate(
        params: GenerateMilestoneTaskApproachCriteriaLangIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-approach-criteria-lang",
                this.milestoneTaskApproachCriteriaIdFactoryService.generate(
                    params,
                ),
                params.langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
