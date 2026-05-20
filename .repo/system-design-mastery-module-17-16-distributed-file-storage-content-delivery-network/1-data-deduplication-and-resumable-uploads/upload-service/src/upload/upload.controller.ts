import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    UploadService,
} from "./upload.service"
import {
    UploadChunkDto,
} from "./dto"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/upload")
export class UploadController {
    constructor(
        private readonly service: UploadService,
    ) {}

    /**
     * Nhan mot chunk va tra ve trang thai resume/dedup.
     * (EN: Accepts one chunk and returns resume/dedup state.)
     */
    @Post("chunk")
    chunk(@Body() body: UploadChunkDto) {
        return this.service.acceptChunk(
            body.uploadId,
            body.checksum,
            body.offsetBytes,
            body.sizeBytes,
        )
    }

}
