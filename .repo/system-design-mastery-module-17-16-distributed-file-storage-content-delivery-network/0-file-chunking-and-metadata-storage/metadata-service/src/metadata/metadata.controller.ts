import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    MetadataService,
} from "./metadata.service"
import {
    ChunkFileDto,
} from "./dto"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/metadata")
export class MetadataController {
    constructor(
        private readonly service: MetadataService,
    ) {}

    /**
     * Tao manifest chunk cho file can upload.
     * (EN: Creates a chunk manifest for a file upload.)
     */
    @Post("chunk")
    chunk(@Body() body: ChunkFileDto) {
        return this.service.chunkFile(
            body.fileId,
            body.fileName,
            body.sizeBytes,
            body.chunkSizeBytes,
        )
    }

}
