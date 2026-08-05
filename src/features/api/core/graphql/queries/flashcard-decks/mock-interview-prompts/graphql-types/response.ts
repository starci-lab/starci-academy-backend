import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One selectable mock interview prompt (a course capstone system).",
})
/**
 * One selectable mock interview prompt (a capstone system reframed as an
 * interview problem). The grading rubric stays server-side.
 */
export class MockInterviewPromptItem {
    @Field(
        () => ID,
        {
            description: "Milestone-task id — pass to the interviewer + grade calls.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Prompt name shown in the picker (the capstone task title).",
        },
    )
        title: string

    @Field(
        () => String,
        {
            description: "Relative difficulty (easy / medium / hard / …); medium when unset.",
        },
    )
        difficulty: string

    @Field(
        () => String,
        {
            description: "Prompt source — `capstone` (curated) or `classic` (AI-generated).",
        },
    )
        source: string
}

@ObjectType({
    description: "The mock interview prompt bank for a course.",
})
/**
 * The mock interview prompt bank for a course -- the prompts the learner
 * can pick to work through.
 */
export class MockInterviewPromptsData {
    @Field(
        () => [MockInterviewPromptItem],
        {
            description: "Selectable prompts, in curriculum order.",
        },
    )
        prompts: Array<MockInterviewPromptItem>
}

@ObjectType({
    description: "Response wrapper for the mockInterviewPrompts query.",
})
/** Response wrapper for the mockInterviewPrompts query. */
export class MockInterviewPromptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MockInterviewPromptsData> {
    /** The course's mock interview prompt bank. */
    @Field(
        () => MockInterviewPromptsData,
        {
            nullable: true,
            description: "The course's mock interview prompt bank.",
        },
    )
        data: MockInterviewPromptsData
}
