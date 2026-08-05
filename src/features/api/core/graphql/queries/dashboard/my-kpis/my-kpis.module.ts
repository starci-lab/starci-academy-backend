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
/** Feature-module boundary for the `myKpis` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyKpisSingleQueryModule extends ConfigurableModuleClass {}
