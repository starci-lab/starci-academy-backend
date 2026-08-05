/** Mount field delimiter line (`# title` / `# body` blocks). */
export const MOUNT_SECTION_DELIMITER_LINE = "<!-- @starci/seperator -->"

/** Regex matching a mount section delimiter line (whitespace tolerant). */
export const MOUNT_SECTION_DELIMITER_LINE_RE =
    /^\s*<!--\s*@starci\/seperator\s*-->\s*$/

/** Regex matching a `<!-- @starci/jsonb -->` wrapper line that fences an inline jsonb leaf (whitespace tolerant). */
export const MOUNT_JSONB_DELIMITER_LINE_RE =
    /^\s*<!--\s*@starci\/jsonb\s*-->\s*$/

/** Regex matching a jsonb item heading line `# <n>`, capturing the array index. */
export const MOUNT_JSONB_ITEM_HEADING_RE = /^#\s+(\d+)\s*$/

/** Regex matching a numeric section key (heading text consisting solely of digits) -> array item. */
export const NUMERIC_SECTION_KEY_RE = /^\d+$/
