import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    CvExportFormat,
    GraphQLTypeCvExportFormat,
} from "../cv-export-format.enum"

@InputType({
    description: "Compile an owned CV document (block editor) to a PDF from its LaTeX source.",
})
/**
 * Compile an owned CV document to a PDF. Full-LaTeX: the FE builds the `.tex`
 * (from the block document, or the user's own edits) and sends it here; the
 * server compiles it with `tectonic`. `id` scopes ownership + lets the PDF key
 * (and the `.tex` source) be persisted back onto the row.
 */
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
            description: "The CV's LaTeX (`.tex`) source (single source of truth; compiled server-side via tectonic).",
        },
    )
        tex: string

    @Field(
        () => GraphQLTypeCvExportFormat,
        {
            nullable: true,
            description: "Target file format — PDF only now (kept for API compatibility).",
        },
    )
        format?: CvExportFormat
}
