import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    FrontierService,
} from "./frontier.service"
import {
    EnqueueUrlDto,
} from "./dto"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/frontier")
export class FrontierController {
    constructor(
        private readonly service: FrontierService,
    ) {}

    /**
     * Dua URL vao frontier neu chua bi danh dau trung lap.
     * (EN: Enqueues a URL when it has not been marked as duplicate.)
     */
    @Post("enqueue")
    enqueue(@Body() body: EnqueueUrlDto) {
        return this.service.enqueue(body.url, body.priority)
    }

}
