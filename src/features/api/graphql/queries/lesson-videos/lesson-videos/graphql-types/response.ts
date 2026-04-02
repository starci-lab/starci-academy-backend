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
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

@ObjectType({
    description: "Paginated list of module lesson videos.",
})
export class LessonVideosResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<LessonVideoEntity>
{
    @Field(
        () => [LessonVideoEntity],
        {
            description: "Lesson videos for the current page.",
        },
    )
        data: Array<LessonVideoEntity>
}

@ObjectType({
    description: "Response wrapper for the lessonVideos query.",
})
export class LessonVideosResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<LessonVideosResponseData>
{
    @Field(
        () => LessonVideosResponseData,
        {
            description: "Payload containing lesson videos and pagination count.",
        },
    )
        data: LessonVideosResponseData
}
