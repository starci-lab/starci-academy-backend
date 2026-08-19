import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "../../../types/execute"
import {
    SubcribeJobNotificationQuery,
} from "./subcribe.query"
import type {
    SubcribeJobNotificationSocketIoPayload,
} from "./types/payload"

@Injectable()
/** Service to handle job notification subscription. */
export class SubcribeJobNotificationService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /** Subscribe to job notifications. */
    async execute(
        params: ExecuteParams<SubcribeJobNotificationSocketIoPayload>,
    ): Promise<undefined> {
        return this.queryBus.execute(
            new SubcribeJobNotificationQuery(params),
        )
    }
}

