import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    SendMailPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessSendMailStepService,
    ProcessSendMailCompleteStepService,
} from "./steps"

@Injectable()
/**
 * Maps step index -> send then complete so a failed SMTP call never marks the mail job
 * complete.
 */
export class SendMailStepMappingService {
    constructor(
        private readonly sendMailStep: ProcessSendMailStepService,
        private readonly sendMailCompleteStep: ProcessSendMailCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<SendMailPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<SendMailPayload, EmptyObject>]
        > = [
            [
                this.sendMailStep.stepIndex,
                this.sendMailStep,
            ],
            [
                this.sendMailCompleteStep.stepIndex,
                this.sendMailCompleteStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
