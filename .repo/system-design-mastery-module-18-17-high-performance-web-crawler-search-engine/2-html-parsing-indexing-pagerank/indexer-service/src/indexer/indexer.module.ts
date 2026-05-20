import {
    Module,
} from "@nestjs/common"
import {
    IndexerController,
} from "./indexer.controller"
import {
    IndexerService,
} from "./indexer.service"

/**
 * Feature module cho bai hoc Parse HTML, indexing va PageRank.
 * (EN: Feature module for HTML Parsing, Indexing, and PageRank.)
 */
@Module({
    controllers: [
        IndexerController,
    ],
    providers: [
        IndexerService,
    ],
    exports: [
        IndexerService,
    ],
})
export class IndexerModule {}
