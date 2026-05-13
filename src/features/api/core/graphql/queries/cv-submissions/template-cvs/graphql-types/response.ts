import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    TemplateCVEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the TemplateCvs query.",
})
export class TemplateCvsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<TemplateCVEntity>>
{
    @Field(
        () => [TemplateCVEntity],
        {
            description: "The list of template CVs.",
        },
    )
        data: Array<TemplateCVEntity>
}
