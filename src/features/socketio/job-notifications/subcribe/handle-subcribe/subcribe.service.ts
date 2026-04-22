import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "@features/socketio/types"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"
import type {
    SubcribeJobNotificationSocketIoPayload,
    SubcribeJobNotificationSocketIoMessage,
} from "./types"

/** Service to handle job notification subscription. */
@Injectable()
export class SubcribeJobNotificationService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /** Subscribe to job notifications. */
    async execute(
        params: ExecuteParams<SubcribeJobNotificationSocketIoPayload>,
    ): Promise<SubcribeJobNotificationSocketIoMessage> {
        return this.queryBus.execute(
            new SubcribeJobNotificationQuery(params),
        )
    }
}

