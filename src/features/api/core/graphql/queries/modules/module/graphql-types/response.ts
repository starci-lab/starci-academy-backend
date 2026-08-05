import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the module query.",
})
/** GraphQL envelope for the `module` detail query. */
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
        data: ModuleEntity
}
