import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    SendMailPayload,
} from "@modules/integrations/bullmq/types/payloads/send-mail"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    ProcessSendMailCompleteStepService,
} from "./steps/process-send-mail-complete-step.service"
import {
    ProcessSendMailStepService,
} from "./steps/process-send-mail-step.service"

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
