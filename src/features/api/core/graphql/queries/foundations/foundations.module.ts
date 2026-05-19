import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundations.module-definition"
import {
    FoundationCategoriesQueryModule,
} from "./foundation-categories"
import {
    FoundationsQueryModule,
} from "./foundations/foundations.module"
import {
    FoundationSingleQueryModule,
} from "./foundation"

@Module({
    imports: [
        FoundationCategoriesQueryModule.register({
            isGlobal: true,
        }),
        FoundationsQueryModule.register({
            isGlobal: true,
        }),
        FoundationSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FoundationsModule extends ConfigurableModuleClass {}
