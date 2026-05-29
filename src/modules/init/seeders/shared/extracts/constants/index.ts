/** Mount field delimiter line (`# title` / `# body` blocks). */
export const MOUNT_SECTION_DELIMITER_LINE = "<!-- @starci/seperator -->"

/** Regex matching a mount section delimiter line (whitespace tolerant). */
export const MOUNT_SECTION_DELIMITER_LINE_RE =
    /^\s*<!--\s*@starci\/seperator\s*-->\s*$/
