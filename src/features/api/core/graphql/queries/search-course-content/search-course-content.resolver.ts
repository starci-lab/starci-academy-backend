import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    SearchCourseContentService,
} from "./search-course-content.service"
import {
    SearchCourseContentData,
    SearchCourseContentResponse,
} from "./graphql-types"

/**
 * "Tìm nội dung khóa" — RAG-based search over a course's lessons, challenges,
 * flashcard decks, and milestone tasks (understands the MEANING of the query,
 * not just literal keyword matches). Powers the ContentAiChat panel's search
 * view. Auth-only (mirrors the sibling course queries) — no extra enrollment
 * check here (the caller is already viewing the course's content).
 */
@Resolver()
export class SearchCourseContentResolver {
    constructor(
        private readonly searchCourseContentService: SearchCourseContentService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course content searched successfully",
        [Locale.Vi]: "Tìm nội dung khóa thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SearchCourseContentResponse,
        {
            name: "searchCourseContent",
            description: "RAG search over a course's lessons/challenges/flashcard decks/milestone tasks.",
        },
    )
    async execute(
        @Args(
            "courseId",
            {
                type: () => ID,
                description: "Course id to search within.",
            },
        )
            courseId: string,
        @Args(
            "query",
            {
                type: () => String,
                description: "The search query — keyword or natural-language question alike.",
            },
        )
            query: string,
    ): Promise<SearchCourseContentData> {
        const results = await this.searchCourseContentService.search({
            courseId,
            query,
        })
        return {
            results,
        }
    }
}
