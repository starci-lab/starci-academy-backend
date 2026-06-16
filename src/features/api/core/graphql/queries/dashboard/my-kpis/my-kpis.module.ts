import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-kpis.module-definition"
import {
    MyKpisResolver,
} from "./my-kpis.resolver"

@Module({
    providers: [
        MyKpisResolver,
    ],
})
export class MyKpisSingleQueryModule extends ConfigurableModuleClass {}
