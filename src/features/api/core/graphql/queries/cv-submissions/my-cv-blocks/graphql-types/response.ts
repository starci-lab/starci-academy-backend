import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A user-authored CV document (ordered blocks + style), course-independent.",
})
/**
 * One user-authored CV document (a `cv_blocks` row), returned to the block
 * editor. `blocks` / `style` are opaque JSON owned by the FE block schema.
 * Shared by the `myCvBlocks` query and the create/update mutations so a CV
 * document has ONE GraphQL shape across the feature.
 */
export class CvBlocksDocument {
    @Field(
        () => ID,
        {
            description: "cv_blocks.id",
        },
    )
        id: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "User-facing CV name (frontend falls back when empty).",
        },
    )
        label: string | null

    @Field(
        () => GraphQLJSON,
        {
            description: "Ordered CV blocks (FE-owned JSON: array of { id, type, title, order, items }).",
        },
    )
        blocks: Array<Record<string, unknown>>

    @Field(
        () => GraphQLJSON,
        {
            description: "Presentation params for the shared template (FE-owned JSON, e.g. { font, accent }).",
        },
    )
        style: Record<string, unknown>

    @Field(
        () => String,
        {
            nullable: true,
            description: "MinIO object key of the last compiled PDF (null until exported / after edits).",
        },
    )
        pdfCdnKey: string | null

    @Field(
        () => Date,
        {
            description: "Creation timestamp (UTC).",
        },
    )
        createdAt: Date

    @Field(
        () => Date,
        {
            description: "Last update timestamp (UTC).",
        },
    )
        updatedAt: Date
}

@ObjectType({
    description: "Response for the current user's CV documents.",
})
/**
 * Response wrapper for the `myCvBlocks` query -- the signed-in user's CV
 * documents, most recently updated first.
 */
export class MyCvBlocksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CvBlocksDocument> | null>
{
    @Field(
        () => [CvBlocksDocument],
        {
            nullable: true,
            description: "The user's CV documents (most recently updated first).",
        },
    )
        data: Array<CvBlocksDocument> | null
}
