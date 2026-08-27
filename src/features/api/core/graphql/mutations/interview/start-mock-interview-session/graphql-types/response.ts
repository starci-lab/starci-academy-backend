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
    description: "One per-language GIVEN code variant of a multi-lang mock-interview question.",
})
/** One per-language GIVEN code variant of a multi-lang mock-interview question. */
export class MockInterviewCodeVariant {
    @Field(
        () => String,
        {
            description: "Programming language of this variant (e.g. \"typescript\", \"java\").",
        },
    )
        lang: string

    @Field(
        () => String,
        {
            description: "GIVEN code for this language.",
        },
    )
        givenCode: string
}

@ObjectType({
    description: "One programming-language variant of a mock-interview question's given code.",
})
/**
 * One authored programming-language variant of a debug/review/optimize
 * question's GIVEN code -- same conceptual bug, one entry per language. The
 * candidate freely switches between these client-side (no refetch).
 */
export class MockInterviewGivenCodeVariantItem {
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
    description: "One drawn flashcard-card seed question for a mode=\"qna\" mock-interview session.",
})
/**
 * One drawn flashcard seed topic for a `mode="qna"` session -- the FE never
 * sees the seed card's answer/keywords (those stay server-side for grading),
 * only enough to identify + preview the topic AND the cognitive frame this
 * ONE question was randomly assigned, so the FE can badge each question
 * (e.g. "2/5 - scenario") and echo the right `kind` back on each ask/grade
 * turn.
 */
export class MockInterviewSeedTopic {
    @Field(
        () => ID,
        {
            description: "The seed flashcard_cards.id.",
        },
    )
        cardId: string

    @Field(
        () => String,
        {
            description: "The cognitive frame this ONE question is asked in (\"theory\" | \"reasoning\" | \"scenario\"), randomly assigned per-question at draw time.",
        },
    )
        kind: string

    @Field(
        () => String,
        {
            description: "Short title/snippet identifying the seed topic (the card's question, truncated).",
        },
    )
        title: string

    @Field(
        () => [MockInterviewGivenCodeVariantItem],
        {
            description: "GIVEN code the candidate should fix/read (bank debug/review/optimize questions), one entry per authored language — split out of title so the FE seeds it into an editable code editor. Empty otherwise.",
        },
    )
        givenCodes: Array<MockInterviewGivenCodeVariantItem>
}

@ObjectType({
    description: "A server-drawn mock-interview prompt session.",
})
/** The server-drawn mock-interview session the learner is about to work through. */
export class StartMockInterviewSessionData {
    @Field(
        () => ID,
        {
            description: "Id of the persisted session draw — pass this to gradeMockInterviewSession so grading trusts the server-stored prompt/level.",
        },
    )
        sessionId: string

    @Field(() => Int,
        {
            description: "Optimistic concurrency token for the first transcript sync."
        })
        revision: number

    @Field(() => String,
        {
            description: "Durable lifecycle state; initially in_progress."
        })
        status: string

    @Field(
        () => ID,
        {
            description: "The drawn prompt's id (a milestone-task id for capstone, or a classic-prompt slug).",
        },
    )
        promptId: string

    @Field(
        () => String,
        {
            description: "The drawn prompt's title, localized. For mode=\"qna\" this is a summary like \"5 câu · Ngẫu nhiên\" rather than one system's title (there is no single \"prompt\" — each question is seeded by its own flashcard topic, see seedTopics).", // vn-ok: localized QnA session title emitted to clients
        },
    )
        promptTitle: string

    @Field(
        () => String,
        {
            description: "The drawn prompt's difficulty tier (\"easy\" | \"medium\" | \"hard\" | \"insane\"). For mode=\"qna\" this is the difficulty pool the level maps to, not a single prompt's own difficulty.",
        },
    )
        difficulty: string

    @Field(
        () => String,
        {
            description: "Where the drawn prompt came from — \"capstone\" or \"classic\" for mode=\"design\"; \"flashcard\" for mode=\"qna\".",
        },
    )
        source: string

    @Field(
        () => String,
        {
            description: "The level the draw was requested for (\"junior\" | \"middle\" | \"senior\").",
        },
    )
        level: string

    /**
     * The TOP-LEVEL flow this session runs -- echoes the (normalized) request
     * `mode` back, one of "qna" | "design". Persist alongside `sessionId` so
     * `gradeMockInterviewSession` can branch its grading rubric per-mode
     * WITHOUT trusting the client -- the FE only needs this to pick which
     * session-workspace flow (N-question Q&A vs 5-phase) to render. "Mode
     * split" (2026-07-06) -- this REPLACES the earlier per-session `kind`
     * field; each question's own cognitive frame is on `seedTopics[].kind` instead.
     */
    @Field(
        () => String,
        {
            description: "Top-level flow this session runs (\"qna\" | \"design\").",
        },
    )
        mode: string

    /**
     * The drawn flashcard-card seed questions, in the order they will be
     * asked -- one per question (default 5) for `mode="qna"`, each carrying
     * its own randomly-assigned `kind`. Empty for `mode="design"` (its prompt
     * is the single capstone/classic system in `promptTitle`, not a list of seeds).
     */
    @Field(
        () => [MockInterviewSeedTopic],
        {
            description: "Drawn flashcard-card seed questions, in ask order — one per question, each with its own randomly-assigned kind. Empty for mode=\"design\".",
        },
    )
        seedTopics: Array<MockInterviewSeedTopic>

    @Field(
        () => String,
        {
            description: "ISO timestamp of the session's 1-hour ask-loop deadline (createdAt + 1h).",
        },
    )
        deadlineAt: string
}

@ObjectType({
    description: "Response wrapper for the startMockInterviewSession mutation.",
})
/**
     * ISO timestamp of when the live interview loop must auto-end (server
     * `createdAt + 1h`, uniform across every mode) -- the FE derives its
     * countdown from THIS, never from a local clock start; the server
     * independently re-enforces the same deadline at ask-time (never
     * trusted from the client).
     */
export class StartMockInterviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<StartMockInterviewSessionData>
{
    @Field(
        () => StartMockInterviewSessionData,
        {
            nullable: true,
            description: "The server-drawn mock-interview session.",
        },
    )
        data: StartMockInterviewSessionData
}
