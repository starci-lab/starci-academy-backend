import type {
    CodeExplainingEntity,
} from "@modules/databases/postgresql/primary/entities/code-explaining.entity"
import type {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"

/** Mount `# codeExplaining` extracts as `codeExplaining`; entity field is `codeExplainings`. */
export type ContentExtractJson = Partial<ContentEntity> & {
    codeExplaining?: Array<Pick<CodeExplainingEntity, "orderIndex" | "code" | "explain">>
}

/**
 * Returns code explaining rows from extracted lesson JSON (singular or plural mount key).
 */
export function getCodeExplainingsFromExtractJson(
    json?: ContentExtractJson,
): Array<Pick<CodeExplainingEntity, "orderIndex" | "code" | "explain">> {
    const rows = json?.codeExplainings ?? json?.codeExplaining
    return Array.isArray(rows) ? rows : []
}
