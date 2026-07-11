import {
    Field,
    Float,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One distinct source matched by "Tìm nội dung khóa" — a lesson, a challenge
 * (which lives on a lesson page), a flashcard deck, or a milestone task. The
 * FE branches on {@link kind} to build the right jump link (via `pathConfig`)
 * — only the fields relevant to that kind are non-null.
 */
@ObjectType({
    description: "One distinct source matched by a course content search.",
})
export class SearchCourseContentItem {
    @Field(
        () => String,
        {
            description: "\"content\" | \"code\" | \"challenge\" | \"flashcard\" | \"milestone\" — which surface this result jumps to.",
        },
    )
        kind: string

    @Field(
        () => String,
        {
            description: "The matched source's title, resolved in the locale it was embedded in.",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short context line above the title (module name for content/challenge, milestone name for milestone tasks); null for flashcard (no natural parent) — FE shows a kind-based label instead.",
        },
    )
        breadcrumb: string | null

    @Field(
        () => String,
        {
            description: "The best-matching chunk's text (caller truncates/escapes for display).",
        },
    )
        snippet: string

    @Field(
        () => Float,
        {
            description: "Cosine similarity of the best-matching chunk (0-1, higher = closer).",
        },
    )
        score: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "kind=content/code/challenge: the module id the target content lives in.",
        },
    )
        moduleId: string | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "kind=content/code/challenge: the content (lesson) id to jump to.",
        },
    )
        contentId: string | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "kind=flashcard: the flashcard deck id to jump to.",
        },
    )
        deckId: string | null

    @Field(
        () => ID,
        {
            nullable: true,
            description: "kind=milestone: the milestone task id to jump to.",
        },
    )
        taskId: string | null
}

/** Payload of the `searchCourseContent` query. */
@ObjectType({
    description: "Course content search results (RAG-based, spans lessons/challenges/flashcards/milestone tasks).",
})
export class SearchCourseContentData {
    @Field(
        () => [SearchCourseContentItem],
        {
            description: "Distinct matched sources, best match first.",
        },
    )
        results: Array<SearchCourseContentItem>
}

/** Response wrapper for the searchCourseContent query. */
@ObjectType({
    description: "Response wrapper for the searchCourseContent query.",
})
export class SearchCourseContentResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SearchCourseContentData> {
    @Field(
        () => SearchCourseContentData,
        {
            nullable: true,
            description: "The search results.",
        },
    )
        data: SearchCourseContentData
}
