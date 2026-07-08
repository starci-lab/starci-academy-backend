import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CvExportFormat,
    GraphQLTypeCvExportFormat,
} from "../cv-export-format.enum"

/**
 * The result of exporting a CV document: a fresh presigned GET URL the FE can
 * open/download immediately, the persisted MinIO object key, and which format
 * was produced.
 */
@ObjectType({
    description: "An exported CV file: presigned URL + persisted object key + format.",
})
export class RenderCvBlocksResult {
    @Field(
        () => String,
        {
            description: "Fresh presigned GET URL for the exported file.",
        },
    )
        url: string

    @Field(
        () => String,
        {
            description: "MinIO object key of the exported file.",
        },
    )
        cdnKey: string

    @Field(
        () => GraphQLTypeCvExportFormat,
        {
            description: "The format that was produced (PDF or DOCX).",
        },
    )
        format: CvExportFormat
}

@ObjectType({
    description: "Response wrapper for the renderCvBlocks (export) mutation.",
})
export class RenderCvBlocksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RenderCvBlocksResult | null>
{
    @Field(
        () => RenderCvBlocksResult,
        {
            nullable: true,
            description: "The exported file (presigned URL + object key + format).",
        },
    )
        data: RenderCvBlocksResult | null
}
