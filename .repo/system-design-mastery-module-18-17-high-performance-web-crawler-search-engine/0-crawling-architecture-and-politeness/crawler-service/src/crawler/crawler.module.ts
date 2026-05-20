import {
    Module,
} from "@nestjs/common"
import {
    CrawlerController,
} from "./crawler.controller"
import {
    CrawlerService,
} from "./crawler.service"

/**
 * Feature module cho bai hoc Kien truc crawler va politeness.
 * (EN: Feature module for Crawling Architecture and Politeness.)
 */
@Module({
    controllers: [
        CrawlerController,
    ],
    providers: [
        CrawlerService,
    ],
    exports: [
        CrawlerService,
    ],
})
export class CrawlerModule {}
