import {
    Module,
} from "@nestjs/common"
import {
    QuorumController,
} from "./quorum.controller"
import {
    QuorumService,
} from "./quorum.service"

/**
 * Feature module cho bài học Quorum consensus và xử lý xung đột.
 * (EN: Feature module for Quorum Consensus and Conflict Resolution.)
 */
@Module({
    controllers: [
        QuorumController,
    ],
    providers: [
        QuorumService,
    ],
    exports: [
        QuorumService,
    ],
})
export class QuorumModule {}
