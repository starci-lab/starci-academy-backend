import type {
    ExecuteParams,
} from "../../../types/execute"
import type {
    SubcribeJobNotificationSocketIoPayload,
} from "./types/payload"

/** Query to subscribe to job notifications. */
export class SubcribeJobNotificationQuery {
    constructor(
        public readonly params: ExecuteParams<SubcribeJobNotificationSocketIoPayload>,
    ) {}
}

