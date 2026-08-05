import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "One programming-language variant of a mock-interview question's given code.",
})
/**
 * One authored programming-language variant of a debug/review/optimize
 * question's GIVEN code, read back for a resumable session.
 */
export class MyInProgressMockInterviewGivenCodeVariantItem {
    @Field(
        () => String,
        {
            description: "Programming language this variant is written in (e.g. \"typescript\").",
        },
    )
        lang: string

    @Field(
        () => String,
        {
            description: "The given code itself, in lang.",
        },
    )
        code: string
}

@ObjectType({
    description: "One drawn seed question of a resumable mock-interview session.",
})
/** One drawn flashcard-card seed question, read back for a resumable session. */
export class MyInProgressMockInterviewSeedQuestionItem {
    @Field(
        () => ID,
        {
            description: "The seed flashcard_cards.id (or mock_interviews.id for a bank-sourced draw).",
        },
    )
        cardId: string

    @Field(
        () => String,
        {
            description: "The cognitive frame this ONE question is asked in (\"theory\" | \"reasoning\" | \"scenario\").",
        },
    )
        kind: string

    @Field(
        () => String,
        {
            description: "Short title/snippet identifying the seed topic.",
        },
    )
        title: string

    @Field(
        () => [MyInProgressMockInterviewGivenCodeVariantItem],
        {
            description: "GIVEN code the candidate should fix/read (debug/review/optimize questions only), one entry per authored language, so resuming re-seeds the SAME code into the workspace. Empty otherwise.",
        },
    )
        givenCodes: Array<MyInProgressMockInterviewGivenCodeVariantItem>
}

@ObjectType({
    description: "One synced turn of a resumable mock-interview session's transcript.",
})
/** One synced transcript turn, read back for a resumable session. */
export class MyInProgressMockInterviewSessionTurnItem {
    @Field(
        () => String,
        {
            description: "Who spoke this turn — \"interviewer\" or \"candidate\".",
        },
    )
        role: string

    @Field(
        () => String,
        {
            description: "Which of the 5 canonical interview phases this turn belongs to (mode=\"design\" only).",
        },
    )
        phase: string

    @Field(
        () => String,
        {
            description: "The turn's Markdown content.",
        },
    )
        content: string

    @Field(
        () => Int,
        {
            nullable: true,
            description: "0-based index of the question this turn belongs to (mode=\"qna\" only).",
        },
    )
        questionIndex?: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Set to \"code\" on an interviewer turn whose given code was seeded into the editable code tool.",
        },
    )
        artifactHint?: string
}

@ObjectType({
    description: "The learner's most recent resumable mock-interview session for one course.",
})
/**
 * The learner's most recent RESUMABLE mock-interview session for one course --
 * "resume mock interview session" (2026-07-08). The query itself resolves to
 * `null` (not this type) when there is none.
 */
export class MyInProgressMockInterviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session draw — pass to syncMockInterviewSessionTurns / gradeMockInterviewSession.",
        },
    )
        sessionId: string

    @Field(
        () => ID,
        {
            description: "The drawn prompt's id.",
        },
    )
        promptId: string

    @Field(
        () => String,
        {
            description: "The drawn prompt's localized title.",
        },
    )
        promptTitle: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level the draw was requested at, or null.",
        },
    )
        level: string | null

    @Field(
        () => String,
        {
            description: "The drawn prompt's difficulty tier.",
        },
    )
        difficulty: string

    @Field(
        () => String,
        {
            description: "Where the drawn prompt came from — \"capstone\" | \"classic\" | \"flashcard\" | \"interview-bank\".",
        },
    )
        source: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "The top-level flow this session runs (\"qna\" | \"design\").",
        },
    )
        mode: string | null

    @Field(
        () => [MyInProgressMockInterviewSeedQuestionItem],
        {
            description: "The drawn flashcard-card seed questions, in ask order. Empty for mode=\"design\".",
        },
    )
        seedQuestions: Array<MyInProgressMockInterviewSeedQuestionItem>

    @Field(
        () => [MyInProgressMockInterviewSessionTurnItem],
        {
            nullable: true,
            description: "The synced transcript so far, or null when no sync has happened yet.",
        },
    )
        turns: Array<MyInProgressMockInterviewSessionTurnItem> | null

    @Field(
        () => Int,
        {
            description: "0-based index of the \"qna\"-mode question the learner was on at the last sync.",
        },
    )
        questionIndex: number

    @Field(
        () => Int,
        {
            description: "0-based index of the \"design\"-mode phase the learner was on at the last sync.",
        },
    )
        phaseIndex: number

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this session was last synced/updated.",
        },
    )
        updatedAt: string

    @Field(
        () => String,
        {
            description: "ISO timestamp of the session's 1-hour ask-loop deadline (createdAt + 1h).",
        },
    )
        deadlineAt: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-chosen name for this practice session; null when the learner didn't name it (FE renders a time-based fallback).",
        },
    )
        name: string | null
}

@ObjectType({
    description: "Response wrapper for the myInProgressMockInterviewSession query.",
})
/**
     * ISO timestamp of the session's 1-hour ask-loop deadline (`createdAt` +
     * 1h) -- a RESUMED session's countdown reflects the TRUE remaining time
     * (anchored to the original draw), never a freshly-reset hour.
     */
export class MyInProgressMockInterviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInProgressMockInterviewSessionData>
{
    @Field(
        () => MyInProgressMockInterviewSessionData,
        {
            nullable: true,
            description: "The learner's most recent resumable session, or null when none exists.",
        },
    )
        data: MyInProgressMockInterviewSessionData
}
