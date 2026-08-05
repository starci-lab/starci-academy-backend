import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mock-interview-prompts.module-definition"
import {
    MockInterviewPromptsResolver,
} from "./mock-interview-prompts.resolver"
import {
    MockInterviewPromptsService,
} from "./mock-interview-prompts.service"

@Module({
    providers: [
        MockInterviewPromptsResolver,
        MockInterviewPromptsService,
    ],
})
/** Feature-module boundary for the `mockInterviewPrompts` query — wires its resolver + service. */
export class MockInterviewPromptsSingleQueryModule extends ConfigurableModuleClass {}
