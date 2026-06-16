import {
    Module,
} from "@nestjs/common"
import {
    ReconnectionGateway,
} from "./reconnection.gateway"
import {
    ReconnectionStoreService,
} from "./reconnection-store.service"

/** Lesson module for `3-reconnection-and-missed-messages`. */
@Module({
    providers: [ReconnectionStoreService,
        ReconnectionGateway],
})
export class ReconnectionMockModule {}
