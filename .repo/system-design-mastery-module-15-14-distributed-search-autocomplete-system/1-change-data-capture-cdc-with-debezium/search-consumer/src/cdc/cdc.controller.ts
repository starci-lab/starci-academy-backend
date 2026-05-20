import {
    Controller,
    Get,
} from "@nestjs/common"
import {
    CdcService,
} from "./cdc.service"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/cdc")
export class CdcController {
    constructor(
        private readonly service: CdcService,
    ) {}

    /**
     * Trả về các sự kiện CDC đã được index.
     * (EN: Returns indexed CDC events.)
     */
    @Get("events")
    events() {
        return this.service.eventsSnapshot()
    }

}
