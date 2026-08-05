import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"

@ObjectType({
    description: "Response wrapper for the playground query.",
})
/**
 * Response wrapper for the playground query.
 *
 * `PlaygroundEntity.steps` only carries `@Field`-decorated columns to
 * GraphQL -- the verify secrets (`verifyResourceKind` /
 * `verifyResourceNamePattern` / `verifyExpectedStatus`) are plain `@Column`s
 * with no `@Field`, so they never reach the client.
 */
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
