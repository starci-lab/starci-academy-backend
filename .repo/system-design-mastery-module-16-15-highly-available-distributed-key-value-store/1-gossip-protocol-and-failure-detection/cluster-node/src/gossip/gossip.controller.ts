import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    GossipService,
} from "./gossip.service"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/gossip")
export class GossipController {
    constructor(
        private readonly service: GossipService,
    ) {}

    /**
     * Trả về membership view hiện tại.
     * (EN: Returns the current membership view.)
     */
    @Get("nodes")
    nodes() {
        return this.service.nodes()
    }

}
