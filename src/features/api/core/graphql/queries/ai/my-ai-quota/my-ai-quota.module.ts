import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-ai-quota.module-definition"
import {
    MyAiQuotaResolver,
} from "./my-ai-quota.resolver"

@Module({
    providers: [
        MyAiQuotaResolver,
    ],
})
export class MyAiQuotaSingleQueryModule extends ConfigurableModuleClass {}
