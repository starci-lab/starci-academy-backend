import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./learn-ai-companion.module-definition"
import {
    LearnAiCompanionMutationResolver 
} from "./learn-ai-companion.resolver"

@Module({
    providers: [LearnAiCompanionMutationResolver],
})
/** Registers the Learn-owned course companion lifecycle mutations. */
export class LearnAiCompanionMutationModule extends ConfigurableModuleClass {}
