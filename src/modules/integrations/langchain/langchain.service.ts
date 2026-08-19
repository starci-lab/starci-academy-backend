import {
    Inject,
    Injectable,
    Optional,
} from "@nestjs/common"
import {
    StringOutputParser,
} from "@langchain/core/output_parsers"
import {
    PromptTemplate,
} from "@langchain/core/prompts"
import {
    MODULE_OPTIONS_TOKEN,
} from "./langchain.module-definition"
import type {
    LangchainModuleOptions,
} from "./types/options"
import type {
    FormatPromptParams,
} from "./types/prompt"

@Injectable()
/**
 * Service exposing common LangChain helpers used by application modules.
 */
export class LangchainService {
    constructor(
        @Optional()
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options?: LangchainModuleOptions,
    ) {}

    /**
     * Gets the configured default system prompt.
     *
     * @returns The default system prompt, or an empty string.
     */
    getDefaultSystemPrompt(): string {
        return this.options?.defaultSystemPrompt || ""
    }

    /**
     * Creates a prompt template instance from a string template.
     *
     * @param template - Prompt template string.
     * @returns PromptTemplate instance.
     */
    createPromptTemplate(template: string): PromptTemplate {
        return PromptTemplate.fromTemplate(template)
    }

    /**
     * Formats a prompt template with provided variable values.
     *
     * @param param - Prompt formatting parameters.
     * @returns The formatted prompt text.
     */
    async formatPrompt({
        template,
        values,
    }: FormatPromptParams): Promise<string> {
        // build prompt template from input string
        const promptTemplate = this.createPromptTemplate(template)

        // render prompt with runtime values
        return promptTemplate.format(values)
    }

    /**
     * Creates a string output parser for LLM responses.
     *
     * @returns StringOutputParser instance.
     */
    getStringOutputParser(): StringOutputParser {
        return new StringOutputParser()
    }
}
