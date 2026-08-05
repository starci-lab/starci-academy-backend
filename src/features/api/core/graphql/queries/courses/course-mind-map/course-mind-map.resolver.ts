import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    CourseMindMapRequest,
    CourseMindMapResponse,
    CourseMindMapResponseData,
} from "./graphql-types"
import {
    CourseMindMapService,
} from "./course-mind-map.service"

@Resolver()
/**
 * GraphQL resolver exposing the computed course mind-map graph (`@xyflow/react` nodes + edges).
 */
export class CourseMindMapResolver {
    constructor(
        private readonly courseMindMapService: CourseMindMapService,
    ) {}

    /**
     * Returns the course mind-map graph derived live from the course hierarchy.
     *
     * @param request - Course id / slug to build the graph for.
     * @param locale - Active request locale.
     * @returns Nodes + edges in React Flow shape.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course mind-map fetched successfully",
        [Locale.Vi]: "Lấy sơ đồ tư duy khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseMindMapResponse,
        {
            name: "courseMindMap",
            description: "Computed course mind-map graph (nodes + edges) for @xyflow/react.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Course id or slug to build the mind-map for.",
            },
        )
            request: CourseMindMapRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseMindMapResponseData> {
        // delegate graph assembly to the service; the transform interceptor wraps the envelope
        return this.courseMindMapService.execute({
            courseId: request.courseId,
            locale,
        })
    }
}
