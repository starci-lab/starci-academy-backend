import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    IndexerService,
} from "./indexer.service"
import {
    IndexDocumentDto,
} from "./dto"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/indexer")
export class IndexerController {
    constructor(
        private readonly service: IndexerService,
    ) {}

    /**
     * Index tai lieu HTML da crawl.
     * (EN: Indexes a crawled HTML document.)
     */
    @Post("document")
    document(@Body() body: IndexDocumentDto) {
        return this.service.index(body.url, body.title, body.html)
    }

}
