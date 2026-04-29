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
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of course modules.",
})
export class ModulesResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<ModuleEntity>
{
    @Field(
        () => [ModuleEntity],
        {
            description: "Modules for the current page.",
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
            description: "Payload containing modules and pagination count.",
        },
    )
        data: ModulesResponseData
}
