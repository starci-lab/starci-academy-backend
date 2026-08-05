import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhunting-companies.module-definition"
import {
    HeadhuntingCompaniesHandler,
} from "./headhunting-companies.handler"
import {
    HeadhuntingCompaniesResolver,
} from "./headhunting-companies.resolver"
import {
    HeadhuntingCompaniesService,
} from "./headhunting-companies.service"

@Module({
    providers: [
        HeadhuntingCompaniesService,
        HeadhuntingCompaniesResolver,
        HeadhuntingCompaniesHandler,
    ],
})
/** Feature-module boundary for the `headhuntingCompanies` query — wires its resolver + service + CQRS handler. */
export class HeadhuntingCompaniesSingleQueryModule extends ConfigurableModuleClass {}
