import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CourseEnrollmentStatusSingleQueryModule,
} from "./course-enrollment-status/course-enrollment-status.module"
import {
    CourseSingleQueryModule,
} from "./course/course.module"
import {
    CoursesSingleQueryModule,
} from "./courses/courses.module"
import {
    LivestreamSessionsSingleQueryModule,
} from "./livestream-sessions/livestream-sessions.module"
import {
    CourseMindMapSingleQueryModule,
} from "./course-mind-map/course-mind-map.module"
import {
    CourseSuggestionsSingleQueryModule,
} from "./course-suggestions/course-suggestions.module"
import {
    CoursePricePreviewSingleQueryModule,
} from "./course-price-preview/course-price-preview.module"
import {
    MyCartSingleQueryModule,
} from "./my-cart/my-cart.module"
import {
    CoursesCheckoutPreviewSingleQueryModule,
} from "./courses-checkout-preview/courses-checkout-preview.module"
import {
    CourseQuestionsSingleQueryModule,
} from "./course-questions/course-questions.module"
import {
    CourseReviewsSingleQueryModule,
} from "./course-reviews/course-reviews.module"
import {
    CoursePriceQuotesSingleQueryModule,
} from "./course-price-quotes/course-price-quotes.module"

@Module({
    imports: [
        CoursePriceQuotesSingleQueryModule.register({
            isGlobal: true,
        }),
        CourseReviewsSingleQueryModule.register({
            isGlobal: true,
        }),
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
/**
 * Courses query group -- catalog, enrollment, cart/checkout preview, mind map,
 * Q&A, suggestions, and livestream leaves. Registered global so each leaf
 * resolver is picked up by the schema.
 */
export class CoursesQueriesModule extends ConfigurableModuleClass {}
