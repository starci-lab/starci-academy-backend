import type {
    ExecuteParams,
} from "@features/socketio/types"
import type {
    SubcribeJobNotificationSocketIoPayload,
} from "./types"

/** Query to subscribe to job notifications. */
export class SubcribeJobNotificationQuery {
    constructor(
        public readonly params: ExecuteParams<SubcribeJobNotificationSocketIoPayload>,
    ) {}
}

