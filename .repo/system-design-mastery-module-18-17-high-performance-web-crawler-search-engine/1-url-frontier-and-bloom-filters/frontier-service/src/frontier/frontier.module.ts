import {
    Module,
} from "@nestjs/common"
import {
    FrontierController,
} from "./frontier.controller"
import {
    FrontierService,
} from "./frontier.service"

/**
 * Feature module cho bai hoc URL frontier va Bloom filter.
 * (EN: Feature module for URL Frontier and Bloom Filters.)
 */
@Module({
    controllers: [
        FrontierController,
    ],
    providers: [
        FrontierService,
    ],
    exports: [
        FrontierService,
    ],
})
export class FrontierModule {}
