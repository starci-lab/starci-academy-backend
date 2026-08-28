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
    JobStatusReadService,
} from "@modules/bussiness/jobs/atomic/job-status-read.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"

@QueryHandler(SubcribeJobNotificationQuery)
@Injectable()
/**
 * Handles a client's request to subscribe to one job's status updates: loads
 * the job scoped to the requesting user (so a job owned by someone else, or a
 * system job with no owner, surfaces as `JobNotFoundException` instead of
 * leaking its status), then joins the caller's socket to that job's room.
 */
export class SubcribeJobNotificationHandler
    extends ICQRSHandler<SubcribeJobNotificationQuery, undefined>
    implements IQueryHandler<SubcribeJobNotificationQuery, undefined> {
    constructor(
        private readonly jobRoomService: JobRoomService,
        private readonly wsResponseService: WsResponseService,
        private readonly jobStatusReadService: JobStatusReadService,
        private readonly userService: UserService,
    ) {
        super()
    }

    /** Process the query. */
    protected override async process(
        query: SubcribeJobNotificationQuery,
    ): Promise<undefined> {
        const { payload, client } = query.params
        // load the job scoped to the requesting user FIRST -- a job owned by
        // someone else (or a system job with no owner) surfaces as
        // JobNotFoundException, same as a genuinely missing row, so the room
        // is never joined and the status/error payload is never returned to
        // a client who does not own this job.
        // Socket auth stamps the verified Keycloak subject, while jobs.user_id
        // stores the internal UserEntity id. Resolve that identity boundary
        // before checking ownership; comparing the two directly silently left
        // every valid learner outside the job room.
        const user = await this.userService.getUserByKeycloakId(client.data.userId)
        const job = await this.jobStatusReadService.getOwned({
            jobId: payload.data.jobId,
            userId: user.id,
        })
        if (!job) {
            return
        }
        // join job room by job id -- only after ownership is verified
        client.join(this.jobRoomService.name(payload.data.jobId))
        this.wsResponseService.success<JobStatusUpdatedSocketIoMessage>(
            {
                message: "Job status updated",
                data: job,
                client,
                eventName: SubscriptionEvent.JobStatusUpdated,
            }
        )
    }
}

