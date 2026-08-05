import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community-feed.module-definition"
import {
    CommunityFeedGateway,
} from "./community-feed.gateway"
import {
    CommunityFeedRoomService,
} from "./community-feed-room.service"

@Module({
    providers: [
        CommunityFeedGateway,
        CommunityFeedRoomService,
    ],
    exports: [
        CommunityFeedGateway,
        CommunityFeedRoomService,
    ],
})
/**
 * Module providing the Socket.IO community feed gateway (posts + comments +
 * reactions realtime).
 */
export class CommunityFeedModule extends ConfigurableModuleClass {}
