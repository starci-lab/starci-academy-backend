import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the TemplateCvs query.",
})
/**
 * Envelope for `templateCvs`: locale-resolved Junior/Mid/Senior review
 * rubrics for the template selector. Public -- no auth on the resolver.
 */
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
