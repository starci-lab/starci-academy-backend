import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    PlaygroundEntity,
} from "@modules/databases"

/**
 * Response wrapper for the playground query.
 *
 * `PlaygroundEntity.steps` only carries `@Field`-decorated columns to
 * GraphQL — the verify secrets (`verifyResourceKind` /
 * `verifyResourceNamePattern` / `verifyExpectedStatus`) are plain `@Column`s
 * with no `@Field`, so they never reach the client.
 */
@ObjectType({
    description: "Response wrapper for the playground query.",
})
export class PlaygroundResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<PlaygroundEntity>
{
    @Field(
        () => PlaygroundEntity,
        {
            nullable: true,
            description: "The requested playground with its ordered steps.",
        },
    )
        data: PlaygroundEntity
}
