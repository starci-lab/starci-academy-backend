import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhuntings.module-definition"
import {
    HeadhuntingCompaniesQueryModule,
} from "./headhunting-companies"
import {
    HeadhuntingCompanyQueryModule,
} from "./headhunting-company"
import {
    ConsultantsQueryModule,
} from "./consultants"
import {
    ConsultantSingleQueryModule,
} from "./consultant"

@Module({
    imports: [
        HeadhuntingCompaniesQueryModule.register({
            isGlobal: true,
        }),
        HeadhuntingCompanyQueryModule.register({
            isGlobal: true,
        }),
        ConsultantsQueryModule.register({
            isGlobal: true,
        }),
        ConsultantSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class HeadhuntingsModule extends ConfigurableModuleClass {}
