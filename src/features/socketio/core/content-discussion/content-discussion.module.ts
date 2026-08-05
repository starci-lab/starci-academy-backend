import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-discussion.module-definition"
import {
    ContentDiscussionGateway,
} from "./content-discussion.gateway"
import {
    ContentDiscussionRoomService,
} from "./content-discussion-room.service"

@Module({
    providers: [
        ContentDiscussionGateway,
        ContentDiscussionRoomService,
    ],
    exports: [
        ContentDiscussionGateway,
        ContentDiscussionRoomService,
    ],
})
/**
 * Module providing the Socket.IO content discussion gateway (comments + reactions realtime).
 */
export class ContentDiscussionModule extends ConfigurableModuleClass {}
