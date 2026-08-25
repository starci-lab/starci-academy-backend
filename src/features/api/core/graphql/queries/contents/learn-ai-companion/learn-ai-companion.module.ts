import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./learn-ai-companion.module-definition"
import {
    LearnAiCompanionQueryResolver 
} from "./learn-ai-companion.resolver"

@Module({
    providers: [LearnAiCompanionQueryResolver],
})
/** Registers the read model for the active Learn-owned course companion. */
export class LearnAiCompanionQueryModule extends ConfigurableModuleClass {}
