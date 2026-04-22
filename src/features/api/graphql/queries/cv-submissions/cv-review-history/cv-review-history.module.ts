import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    ConfigurableModuleClass,
} from "./cv-review-history.module-definition"
import {
    CvReviewHistoryResolver,
} from "./cv-review-history.resolver"
import {
    CvReviewHistoryService,
} from "./cv-review-history.service"
import {
    CvReviewHistoryHandler,
} from "./cv-review-history.handler"

@Module({
    imports: [
        S3Module,
    ],
    providers: [
        CvReviewHistoryResolver,
        CvReviewHistoryService,
        CvReviewHistoryHandler,
    ],
})
export class CvReviewHistoryQueryModule extends ConfigurableModuleClass {}
