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
export class HeadhuntingCompanyQueryModule extends ConfigurableModuleClass {}
