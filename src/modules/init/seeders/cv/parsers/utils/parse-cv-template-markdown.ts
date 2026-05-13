import type {
    ParsedCvTemplateMarkdown,
} from "../types"

/**
 * Parse a markdown file with `# title`, `# description`, `# body` sections.
 * Used for CV review template files under `.mount/data/cv/<key>/{en,vi}.md`.
 */
export function parseCvTemplateMarkdown(content: string): ParsedCvTemplateMarkdown {
    const lines = content.split(/\r?\n/)
    let currentSection: "title" | "description" | "body" | null = null
    const sections: Record<string, Array<string>> = {
        title: [],
        description: [],
        body: [],
    }

    for (const line of lines) {
        const trimmed = line.trim()
        if (/^#\s+title$/i.test(trimmed)) {
            currentSection = "title"
            continue
        }
        if (/^#\s+description$/i.test(trimmed)) {
            currentSection = "description"
            continue
        }
        if (/^#\s+body$/i.test(trimmed)) {
            currentSection = "body"
            continue
        }
        if (currentSection) {
            sections[currentSection].push(line)
        }
    }

    return {
        title: sections.title.join("\n").trim(),
        description: sections.description.join("\n").trim() || null,
        body: sections.body.join("\n").trim(),
    }
}
