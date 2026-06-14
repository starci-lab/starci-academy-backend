import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"
import type {
    SubcribeJobNotificationSocketIoMessage,
} from "./types"
import {
    JobRoomService,
} from "@modules/bullmq"
import {
    WsResponseService,
} from "@modules/socketio"
import {
    JobStatusUpdatedSocketIoMessage 
} from "../../types"
import {
    SubscriptionEvent 
} from "../../../enums"
import {
    JobNotFoundException,
} from "@modules/exceptions"
import {
    JobActionService,
} from "@modules/bussiness"

@QueryHandler(SubcribeJobNotificationQuery)
@Injectable()
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
        // join job room by job id
        client.join(this.jobRoomService.name(payload.data.jobId))
        const job = await this.jobActionService.getJob({
            id: payload.data.jobId,
        })
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

