import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "../abstracts"
import {
    ProccessGitUrlGradeStepService,
    ProccessGitUrlLoadDocsStepService,
    ProccessGitUrlResolveContextStepService,
    ProccessGitUrlSplitDocsStepService,
    ProccessGitUrlVectorizeStepService,
} from "./steps"
import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"

/**
 * Maps pipeline step index to the step service (resolve → load → split → vectorize → grade).
 */
@Injectable()
export class ProccessGitUrlStepMappingService {
    constructor(
        private readonly resolveContextStepService: ProccessGitUrlResolveContextStepService,
        private readonly loadDocsStepService: ProccessGitUrlLoadDocsStepService,
        private readonly splitDocsStepService: ProccessGitUrlSplitDocsStepService,
        private readonly vectorizeStepService: ProccessGitUrlVectorizeStepService,
        private readonly gradeStepService: ProccessGitUrlGradeStepService,
    ) {}

    /**
     * Build the step map (index → handler). Job `maxSteps` must be **5**.
     * @returns The step map.
     */
    getStepMap(): Map<number, AbstractStepService<ProccessGitUrlPayload>> {
        return new Map<number, AbstractStepService<ProccessGitUrlPayload>>(
            [
                [
                    this.resolveContextStepService.stepIndex,
                    this.resolveContextStepService,
                ],
                [
                    this.loadDocsStepService.stepIndex,
                    this.loadDocsStepService,
                ],
                [
                    this.splitDocsStepService.stepIndex,
                    this.splitDocsStepService,
                ],
                [
                    this.vectorizeStepService.stepIndex,
                    this.vectorizeStepService,
                ],
                [
                    this.gradeStepService.stepIndex,
                    this.gradeStepService,
                ],
            ],
        )
    }
}
