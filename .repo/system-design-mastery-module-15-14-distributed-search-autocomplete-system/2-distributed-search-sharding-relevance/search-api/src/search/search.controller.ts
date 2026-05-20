import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import {
    SearchService,
} from "./search.service"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/search")
export class SearchController {
    constructor(
        private readonly service: SearchService,
    ) {}

    /**
     * Thực thi truy vấn search phân tán.
     * (EN: Executes a distributed search query.)
     */
    @Get()
    query(@Query("q") q = "laptop") {
        return this.service.query(q)
    }

}
