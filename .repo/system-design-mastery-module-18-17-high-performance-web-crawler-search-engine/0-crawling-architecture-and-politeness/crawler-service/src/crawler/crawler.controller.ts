import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    CrawlerService,
} from "./crawler.service"
import {
    ScheduleCrawlDto,
} from "./dto"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/crawl")
export class CrawlerController {
    constructor(
        private readonly service: CrawlerService,
    ) {}

    /**
     * Dua URL vao hang doi crawl voi politeness theo host.
     * (EN: Enqueues a URL for host-level polite crawling.)
     */
    @Post("schedule")
    schedule(@Body() body: ScheduleCrawlDto) {
        return this.service.schedule(body.url, body.userAgent)
    }

}
