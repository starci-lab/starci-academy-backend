import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhunting-company.module-definition"
import {
    HeadhuntingCompanyHandler,
} from "./headhunting-company.handler"
import {
    HeadhuntingCompanyResolver,
} from "./headhunting-company.resolver"
import {
    HeadhuntingCompanyService,
} from "./headhunting-company.service"

@Module({
    providers: [
        HeadhuntingCompanyService,
        HeadhuntingCompanyResolver,
        HeadhuntingCompanyHandler,
    ],
})
/** Feature-module boundary for the `headhuntingCompany` query -- wires its resolver + service + CQRS handler. */
export class HeadhuntingCompanySingleQueryModule extends ConfigurableModuleClass {}
