/** Params to format a LangChain prompt template. */
export interface FormatPromptParams {
    template: string
    values: Record<string, string | number | boolean>
}

/** Result after formatting a prompt template. */
export type FormatPromptResult = string
