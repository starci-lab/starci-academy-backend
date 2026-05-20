import {
    Module,
} from "@nestjs/common"
import {
    SearchController,
} from "./search.controller"
import {
    SearchService,
} from "./search.service"

/**
 * Feature module cho bài học Search phân tán, sharding và relevance.
 * (EN: Feature module for Distributed Search Sharding and Relevance.)
 */
@Module({
    controllers: [
        SearchController,
    ],
    providers: [
        SearchService,
    ],
    exports: [
        SearchService,
    ],
})
export class SearchModule {}
