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
    Document,
} from "@langchain/core/documents"
import {
    MODULE_OPTIONS_TOKEN,
} from "./langchain.module-definition"
import type {
    FormatPromptParams,
    FormatPromptResult,
    LangchainModuleOptions,
} from "./types"

/**
 * Service exposing common LangChain helpers used by application modules.
 */
@Injectable()
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
    }: FormatPromptParams): Promise<FormatPromptResult> {
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

    /**
     * Loads text content from a Google Doc using a public export URL (Plan B).
     *
     * @param url - The Google Doc URL.
     * @returns Array of Document objects.
     */
    async loadGoogleDocs(url: string): Promise<Document[]> {
        // extract document ID from URL
        const match = url.match(/[-\w]{25,}/)
        if (!match) {
            throw new Error(`Invalid Google Doc URL: ${url}`)
        }
        const documentId = match[0]

        // use the public export URL
        const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`

        const response = await fetch(exportUrl)
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Google Doc is not public. Please share it as 'Anyone with the link can view'."
                )
            }
            throw new Error(
                `Failed to fetch Google Doc (Status: ${response.status}). Ensure ID is correct and doc is public.`
            )
        }

        const text = await response.text()

        return [
            new Document({
                pageContent: text,
                metadata: {
                    source: url,
                    documentId,
                },
            }),
        ]
    }
}
