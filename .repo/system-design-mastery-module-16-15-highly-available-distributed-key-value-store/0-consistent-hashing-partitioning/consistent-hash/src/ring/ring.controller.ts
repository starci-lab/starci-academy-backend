import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import {
    RingService,
} from "./ring.service"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/ring")
export class RingController {
    constructor(
        private readonly service: RingService,
    ) {}

    /**
     * Trả về node chịu trách nhiệm cho key.
     * (EN: Returns the node responsible for a key.)
     */
    @Get("map")
    map(@Query("key") key = "user_session_45") {
        return this.service.map(key)
    }

}
