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

@ObjectType({
    description: "Data for the modules query.",
})
export class ModulesResponseData {
    @Field(
        () => [ModuleEntity],
        {
            description: "All modules for the course.",
        },
    )
        data: Array<ModuleEntity>
}

@ObjectType({
    description: "Response wrapper for the modules query.",
})
export class ModulesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ModulesResponseData>
{
    @Field(
        () => ModulesResponseData,
        {
            nullable: true,
            description: "Payload containing modules.",
        },
    )
        data: ModulesResponseData
}
