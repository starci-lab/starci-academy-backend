import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollmentStatusSingleQueryModule,
} from "./course-enrollment-status"
import {
    CourseSingleQueryModule,
} from "./course"
import {
    CoursesSingleQueryModule,
} from "./courses"
import {
    LivestreamSessionsSingleQueryModule,
} from "./livestream-sessions"
import {
    CourseMindMapSingleQueryModule,
} from "./course-mind-map"
import {
    CourseSuggestionsSingleQueryModule,
} from "./course-suggestions"
import {
    CoursePricePreviewSingleQueryModule,
} from "./course-price-preview"
import {
    MyCartSingleQueryModule,
} from "./my-cart"
import {
    CoursesCheckoutPreviewSingleQueryModule,
} from "./courses-checkout-preview"
import {
    CourseQuestionsSingleQueryModule,
} from "./course-questions"

@Module({
    imports: [
        CourseQuestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCartSingleQueryModule.register({
            isGlobal: true,
        }),
        CoursesCheckoutPreviewSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseMindMapSingleQueryModule.register({
            isGlobal: true,
        }),
        CoursePricePreviewSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        CoursesSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseEnrollmentStatusSingleQueryModule.register({
            isGlobal: true,
        }),
        LivestreamSessionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class CoursesQueriesModule extends ConfigurableModuleClass {}
