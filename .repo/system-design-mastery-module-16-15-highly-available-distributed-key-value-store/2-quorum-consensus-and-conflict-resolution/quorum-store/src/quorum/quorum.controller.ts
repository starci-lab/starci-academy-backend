import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    QuorumService,
} from "./quorum.service"
import {
    QuorumWriteDto,
} from "./dto"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/quorum")
export class QuorumController {
    constructor(
        private readonly service: QuorumService,
    ) {}

    /**
     * Thực hiện ghi dữ liệu với tham số W/R.
     * (EN: Performs a write with W/R parameters.)
     */
    @Post("write")
    write(@Body() body: QuorumWriteDto) {
        return this.service.write(
            body.key,
            body.value,
            body.w,
            body.r,
        )
    }

}
