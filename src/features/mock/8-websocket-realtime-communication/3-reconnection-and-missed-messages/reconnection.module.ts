import {
    Module,
} from "@nestjs/common"
import {
    ReconnectionGateway,
} from "./reconnection.gateway"
import {
    ReconnectionStoreService,
} from "./reconnection-store.service"

@Module({
    providers: [ReconnectionStoreService,
        ReconnectionGateway],
})
/** Lesson module for `3-reconnection-and-missed-messages`. */
export class ReconnectionMockModule {}
