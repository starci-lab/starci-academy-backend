import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ModuleEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** GraphQL envelope for the module by id query. */
@ObjectType({
    description: "Response wrapper for the module query.",
})
export class ModuleResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ModuleEntity>
{
    @Field(
        () => ModuleEntity,
        {
            nullable: true,
            description: "The module for the requested id (errors if not found).",
        },
    )
        data?: ModuleEntity
}

