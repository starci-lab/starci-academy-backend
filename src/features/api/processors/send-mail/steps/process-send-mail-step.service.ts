import type {
    SendMailPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    MailerService 
} from "@nestjs-modules/mailer"

/**
 * Step 0: run the send mail `process()` for the target entity.
 */
@Injectable()
export class ProcessSendMailStepService extends AbstractStepService<
    SendMailPayload,
    EmptyObject
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly mailerService: MailerService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "send-mail"
    stepContextKey = "send-mail-step-context"

    /** Process the step. */
    async process(
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(
                context,
            )
            await this.finalize(
                executionResult,
                context,
            )
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                    emitChangeEvent: false,
                },
            )
            throw error
        }
    }
    
    /**
     * Execute the step.
     * @param context - The context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const { payload } = context
        console.log(payload)
        await this.mailerService.sendMail(
            {
                to: payload.to.map((recipient) => recipient.address),
                cc: payload.cc?.map((recipient) => recipient.address),
                bcc: payload.bcc?.map((recipient) => recipient.address),
                subject: payload.subject,
                context: payload.context,
                template: payload.template,
            }
        )
        return {
        }
    }

    /**
     * Build per-locale entity JSON, skip when the Minio snapshot hash is unchanged, upload by id and display id.
     */
    

    /** Finalize the step. */
    private async finalize(
        executionResult: EmptyObject,
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    }
                )
            }
        )
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}
