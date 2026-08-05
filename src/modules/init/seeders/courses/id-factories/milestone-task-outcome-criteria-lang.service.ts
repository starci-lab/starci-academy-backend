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
    MilestoneTaskOutcomeCriteriaIdFactoryService,
} from "./milestone-task-outcome-criteria.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMilestoneTaskOutcomeCriteriaLangIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic ids for the per-language prose rows under a SCHEMA V2 milestone-task OUTCOME
 * criterion; chains from the parent outcome-criterion id string for idempotent re-seed.
 */
export class MilestoneTaskOutcomeCriteriaLangIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly milestoneTaskOutcomeCriteriaIdFactoryService: MilestoneTaskOutcomeCriteriaIdFactoryService,
    ) {}

    generate(
        params: GenerateMilestoneTaskOutcomeCriteriaLangIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "milestone-task-outcome-criteria-lang",
                this.milestoneTaskOutcomeCriteriaIdFactoryService.generate(
                    params,
                ),
                params.langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
