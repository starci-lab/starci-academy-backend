import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhuntings.module-definition"
import {
    HeadhuntingCompaniesSingleQueryModule,
} from "./headhunting-companies"
import {
    HeadhuntingCompanySingleQueryModule,
} from "./headhunting-company"
import {
    ConsultantsSingleQueryModule,
} from "./consultants"
import {
    ConsultantSingleQueryModule,
} from "./consultant"
import {
    HeadhuntingCompanySuggestionsSingleQueryModule,
} from "./headhunting-company-suggestions"
import {
    ConsultantSuggestionsSingleQueryModule,
} from "./consultant-suggestions"

@Module({
    imports: [
        HeadhuntingCompaniesSingleQueryModule.register({
            isGlobal: true,
        }),
        HeadhuntingCompanySingleQueryModule.register({
            isGlobal: true,
        }),
        ConsultantsSingleQueryModule.register({
            isGlobal: true,
        }),
        ConsultantSingleQueryModule.register({
            isGlobal: true,
        }),
        HeadhuntingCompanySuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        ConsultantSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Headhuntings query group — companies and consultants, single-lookup and
 * list/autocomplete variants: `headhuntingCompanies`/`headhuntingCompany`,
 * `consultants`/`consultant`, and their two suggestion (typeahead) leaves.
 * Each leaf is registered global so its resolver is picked up by the schema.
 */
export class HeadhuntingsModule extends ConfigurableModuleClass {}
