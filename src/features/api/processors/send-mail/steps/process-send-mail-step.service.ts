import type {
    SendMailPayload,
} from "@modules/integrations/bullmq/types/payloads/send-mail"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    MailerService 
} from "@nestjs-modules/mailer"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"

const DISPATCH_CHECKPOINT = "send-mail-dispatch-claimed"

@Injectable()
/**
 * Step 0: run the send mail `process()` for the target entity.
 */
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
        const executionResult = await this.execute(context)
        await this.finalize(executionResult,
            context)
    }
    
    /**
     * Execute the step.
     * @param context - The context.
     * @returns The execution result.
     */
    private async execute(
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<EmptyObject> {
        const shouldDispatch = await this.claimDispatch(context)
        if (!shouldDispatch) {
            return {
            }
        }
        const { payload } = context
        try {
            await this.mailerService.sendMail({
                messageId: context.job.id,
                to: payload.to.map((recipient) => recipient.address),
                cc: payload.cc?.map((recipient) => recipient.address),
                bcc: payload.bcc?.map((recipient) => recipient.address),
                replyTo: payload.replyTo?.address,
                from: payload.from?.address,
                subject: payload.subject,
                context: payload.context,
                template: payload.template,
                html: payload.html,
                text: payload.text,
                attachments: payload.attachments?.map((attachment) => ({
                    filename: attachment.filename,
                    content: attachment.contentBase64 === undefined
                        ? undefined
                        : Buffer.from(attachment.contentBase64,
                            "base64"),
                    path: attachment.path,
                    href: attachment.href,
                    contentType: attachment.contentType,
                    cid: attachment.cid,
                })),
                headers: payload.headers,
            })
        } catch (error) {
            await this.releaseDispatch(context)
            throw error
        }
        return {
        }
    }

    /**
     * Durably claims SMTP dispatch before crossing the non-transactional boundary.
     *
     * A retry that observes the claim treats an interrupted dispatch as already sent. SMTP has
     * no portable idempotency API, so this deliberately chooses at-most-once delivery over sending
     * the same transactional message twice after a post-send database failure.
     */
    private async claimDispatch(
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<boolean> {
        return this.entityManager.transaction(async (entityManager) => {
            const job = await entityManager.findOneOrFail(
                JobEntity,
                {
                    where: {
                        id: context.job.id,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                },
            )
            const claimed = await this.jobActionService.loadExecutionResult<boolean>({
                job,
                key: DISPATCH_CHECKPOINT,
            })
            if (claimed) {
                context.job.executionResults = job.executionResults
                return false
            }
            await this.jobActionService.saveExecutionResult({
                job,
                key: DISPATCH_CHECKPOINT,
                executionResult: true,
                entityManager,
            })
            context.job.executionResults = job.executionResults
            return true
        })
    }

    /** Release a claim only when SMTP explicitly rejected the request, making a retry safe. */
    private async releaseDispatch(
        context: JobExtendedContext<SendMailPayload, EmptyObject>,
    ): Promise<void> {
        await this.jobActionService.saveExecutionResult({
            job: context.job,
            key: DISPATCH_CHECKPOINT,
            executionResult: false,
        })
    }
    
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
