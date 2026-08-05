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
/** Feature-module boundary for the `myAiQuota` query -- wires its resolver so the AI group can mount this read independently. */
export class MyAiQuotaSingleQueryModule extends ConfigurableModuleClass {}
