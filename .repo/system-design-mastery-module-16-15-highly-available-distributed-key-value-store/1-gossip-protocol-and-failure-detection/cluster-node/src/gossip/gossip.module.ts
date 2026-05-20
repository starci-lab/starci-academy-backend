import {
    Module,
} from "@nestjs/common"
import {
    GossipController,
} from "./gossip.controller"
import {
    GossipService,
} from "./gossip.service"

/**
 * Feature module cho bài học Gossip protocol và phát hiện lỗi.
 * (EN: Feature module for Gossip Protocol and Failure Detection.)
 */
@Module({
    controllers: [
        GossipController,
    ],
    providers: [
        GossipService,
    ],
    exports: [
        GossipService,
    ],
})
export class GossipModule {}
