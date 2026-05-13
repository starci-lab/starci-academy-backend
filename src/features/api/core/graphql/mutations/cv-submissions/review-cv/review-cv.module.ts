import {
    Module,
} from "@nestjs/common"
import {
    ReviewCvResolver,
} from "./review-cv.resolver"
import {
    ReviewCvService,
} from "./review-cv.service"
import {
    ReviewCvHandler,
} from "./review-cv.handler"

@Module({
    providers: [
        ReviewCvResolver,
        ReviewCvService,
        ReviewCvHandler,
    ],
})
export class ReviewCvMutationModule {}
