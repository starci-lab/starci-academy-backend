import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * The file format a CV document is exported to. Both are produced from the SAME
 * HTML the FE renders for its live preview (single-source, HTML-first) — PDF via
 * Puppeteer, DOCX via html-to-docx.
 */
export enum CvExportFormat {
    /** A print-quality PDF (Puppeteer / headless Chromium). */
    Pdf = "pdf",
    /** An editable Word document (html-to-docx). */
    Docx = "docx",
}

export const GraphQLTypeCvExportFormat = createEnumType(CvExportFormat)

registerEnumType(
    GraphQLTypeCvExportFormat,
    {
        name: "CvExportFormat",
        description: "The file format a CV document is exported to (PDF or DOCX).",
        valuesMap: {
            [CvExportFormat.Pdf]: {
                description: "A print-quality PDF (Puppeteer).",
            },
            [CvExportFormat.Docx]: {
                description: "An editable Word document (html-to-docx).",
            },
        },
    },
)
