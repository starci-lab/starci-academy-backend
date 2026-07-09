import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Delete one of the signed-in user's CV documents.
 */
@InputType({
    description: "Delete a CV document.",
})
export class DeleteCvBlocksRequest {
    @Field(
        () => ID,
        {
            description: "cv_blocks.id of the document to delete (must belong to the caller).",
        },
    )
        id: string
}
