import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-price-quotes.module-definition"
import {
    CoursePriceQuotesResolver,
} from "./course-price-quotes.resolver"
import {
    CoursePriceQuotesService,
} from "./course-price-quotes.service"

@Module({
    providers: [CoursePriceQuotesResolver,
        CoursePriceQuotesService] 
})
/** GraphQL registration for coursePriceQuotes. */
export class CoursePriceQuotesSingleQueryModule extends ConfigurableModuleClass {}
