import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-pricing.module-definition"
import {
    CoursePriceCalculatorService,
} from "./course-price-calculator.service"
import {
    CoursePriceQuoteService,
} from "./course-price-quote.service"

@Module({
    providers: [CoursePriceCalculatorService,
        CoursePriceQuoteService],
    exports: [CoursePriceCalculatorService,
        CoursePriceQuoteService],
})
/** Shared course-price arithmetic and quote orchestration. */
export class CoursePricingModule extends ConfigurableModuleClass {}
