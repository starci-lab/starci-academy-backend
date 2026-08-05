import pdfParse from "pdf-parse"
import mammoth from "mammoth"
import type {
    ExtractCvTextParams,
} from "../types"

/**
 * Extract plain text from an uploaded CV file buffer, branching on the file
 * extension. Used by the gather step in `Revise` mode so the compose step can
 * feed the LLM the learner's existing CV alongside their verified achievements.
 *
 * - `.pdf` → `pdf-parse`
 * - `.docx` → `mammoth` (raw text)
 * - anything else → treated as UTF-8 text
 *
 * Extraction is best-effort: a malformed/unsupported file yields `""` rather
 * than throwing, so a Revise run degrades to a Generate-style prompt instead of
 * failing the whole job.
 *
 * @param params - The file buffer and the object key (its extension selects the extractor).
 * @returns The extracted text (trimmed), or "" when extraction is not possible.
 */
export const extractCvText = async (
    {
        buffer,
        key,
    }: ExtractCvTextParams,
): Promise<string> => {
    const lowerKey = key.toLowerCase()
    try {
        if (lowerKey.endsWith(".pdf")) {
            const parsed = await pdfParse(buffer)
            return parsed.text.trim()
        }
        if (lowerKey.endsWith(".docx")) {
            const result = await mammoth.extractRawText({
                buffer,
            })
            return result.value.trim()
        }
        // unknown extension → assume plain text
        return buffer.toString("utf8").trim()
    } catch {
        // extraction failure must not fail the job — degrade to no source text
        return ""
    }
}
