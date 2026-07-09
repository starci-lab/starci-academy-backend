import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Extracted plain-text payload for `extractDocumentText` — the raw text pulled
 * out of the uploaded file (pdf/docx/plain). Not persisted; the FE loads it
 * into the paste field for the user to review.
 */
@ObjectType({
    description: "Plain text extracted from an uploaded document (not persisted).",
})
export class ExtractDocumentTextData {
    @Field(
        () => String,
        {
            description: "The plain text extracted from the uploaded file.",
        },
    )
        text: string
}

@ObjectType({
    description: "Response wrapper for the extractDocumentText mutation.",
})
export class ExtractDocumentTextResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ExtractDocumentTextData | null>
{
    @Field(
        () => ExtractDocumentTextData,
        {
            nullable: true,
            description: "The extracted document text.",
        },
    )
        data: ExtractDocumentTextData | null
}
