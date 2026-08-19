/** Params to format a LangChain prompt template. */
export interface FormatPromptParams {
    template: string
    values: Record<string, string | number | boolean>
}


