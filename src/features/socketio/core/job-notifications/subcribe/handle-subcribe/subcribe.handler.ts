import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"
import type {
    SubcribeJobNotificationSocketIoMessage,
} from "./types/message"
import {
    JobRoomService,
} from "@modules/integrations/bullmq/rooms/job.service"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    JobStatusUpdatedSocketIoMessage,
} from "../../types/job-status-message"
import {
    SubscriptionEvent,
} from "../../../enums/subscription-event"
import {
    JobNotFoundException,
} from "@modules/platform/exceptions/errors/job/not-found"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"

@QueryHandler(SubcribeJobNotificationQuery)
@Injectable()
/**
 * Handles a client's request to subscribe to one job's status updates: loads
 * the job scoped to the requesting user (so a job owned by someone else, or a
 * system job with no owner, surfaces as `JobNotFoundException` instead of
 * leaking its status), then joins the caller's socket to that job's room.
 */
export class SubcribeJobNotificationHandler
    extends ICQRSHandler<SubcribeJobNotificationQuery, SubcribeJobNotificationSocketIoMessage>
    implements IQueryHandler<SubcribeJobNotificationQuery, SubcribeJobNotificationSocketIoMessage> {
    constructor(
        private readonly jobRoomService: JobRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly jobActionService: JobActionService,
    ) {
        super()
    }

    /** Process the query. */
    protected override async process(
        query: SubcribeJobNotificationQuery,
    ): Promise<SubcribeJobNotificationSocketIoMessage> {
        const { payload, client } = query.params
        // load the job scoped to the requesting user FIRST -- a job owned by
        // someone else (or a system job with no owner) surfaces as
        // JobNotFoundException, same as a genuinely missing row, so the room
        // is never joined and the status/error payload is never returned to
        // a client who does not own this job.
        const job = await this.jobActionService.getJob({
            id: payload.data.jobId,
            userId: client.data.userId,
        })
        // join job room by job id -- only after ownership is verified
        client.join(this.jobRoomService.name(payload.data.jobId))
        if (!job) {
            this.wsResponseService.error({
                client,
                error: new JobNotFoundException({
                    id: payload.data.jobId,
                }),
                eventName: SubscriptionEvent.JobStatusUpdated,
            })
            return
        }
        this.wsResponseService.success<JobStatusUpdatedSocketIoMessage>(
            {
                message: "Job status updated",
                data: {
                    jobId: job.id,
                    challengeSubmissionId: job.refs?.challengeSubmissionId ?? "",
                    category: job.category ?? undefined,
                    actionType: job.actionType,
                    status: job.status,
                    error: job.error ?? undefined,
                },
                client,
                eventName: SubscriptionEvent.JobStatusUpdated,
            }
        )
    }
}

