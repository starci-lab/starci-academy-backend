import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    CvExportFormat,
    GraphQLTypeCvExportFormat,
} from "../cv-export-format.enum"

/**
 * Export an owned CV document to a file. HTML-first: the FE renders the ONE
 * shared CV template and sends its serialized, self-contained HTML here; the
 * server is a dumb converter (Puppeteer → PDF, html-to-docx → DOCX). `id` scopes
 * ownership + lets the PDF key be persisted back onto the row.
 */
@InputType({
    description: "Export an owned CV document (block editor) to PDF or DOCX from its rendered HTML.",
})
export class RenderCvBlocksRequest {
    @Field(
        () => ID,
        {
            description: "cv_blocks.id of the document to export (must belong to the caller).",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "The self-contained HTML of the rendered CV template (single source; converted server-side).",
        },
    )
        html: string

    @Field(
        () => GraphQLTypeCvExportFormat,
        {
            description: "Target file format (PDF or DOCX).",
        },
    )
        format: CvExportFormat
}
