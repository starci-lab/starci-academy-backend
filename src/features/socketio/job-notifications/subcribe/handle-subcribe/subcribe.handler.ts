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

@QueryHandler(SubcribeJobNotificationQuery)
@Injectable()
export class SubcribeJobNotificationHandler
    extends ICQRSHandler<SubcribeJobNotificationQuery, SubcribeJobNotificationSocketIoMessage>
    implements IQueryHandler<SubcribeJobNotificationQuery, SubcribeJobNotificationSocketIoMessage> {
    constructor(
        private readonly jobRoomService: JobRoomService,
    ) {
        super()
    }
    /** Process the query. */
    protected override async process(
        query: SubcribeJobNotificationQuery,
    ): Promise<undefined> {
        const { payload, client } = query.params
        // join job room by job id
        client.join(this.jobRoomService.name(payload.data.jobId))
    }
}

