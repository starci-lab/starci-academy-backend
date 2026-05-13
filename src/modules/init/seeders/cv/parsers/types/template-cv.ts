/**
 * Parsed body of a locale markdown file under `.mount/data/cv/<key>/{en,vi}.md`.
 */
export interface ParsedCvTemplateMarkdown {
    title: string
    description: string | null
    body: string
}
