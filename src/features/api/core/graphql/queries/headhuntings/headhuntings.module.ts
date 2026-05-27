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
    ],
})
export class HeadhuntingsModule extends ConfigurableModuleClass {}
