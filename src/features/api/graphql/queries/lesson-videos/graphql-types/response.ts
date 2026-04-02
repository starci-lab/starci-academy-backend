import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    LessonVideoEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the lessonVideo query.",
})
export class LessonVideoResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LessonVideoEntity>
{
    @Field(
        () => LessonVideoEntity,
        {
            nullable: true,
            description: "The lesson video for the requested id.",
        },
    )
        data?: LessonVideoEntity
}
