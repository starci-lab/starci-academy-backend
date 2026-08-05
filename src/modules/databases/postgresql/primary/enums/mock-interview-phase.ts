import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * The five canonical phases of a mock interview, in interview-driven order.
 * Drives both the interviewer's system prompt (which phase it should be
 * probing) and the grader's rubric breakdown (`phaseScores` on
 * `mock_interview_attempts`).
 */
export enum MockInterviewPhase {
    /** Clarify functional + non-functional requirements and scale estimates. */
    Requirements = "requirements",
    /** Back-of-the-envelope estimation (QPS/storage) + API surface sketch. */
    Estimation = "estimation",
    /** Boxes-and-arrows high-level architecture (5-7 major components). */
    HighLevel = "highLevel",
    /** Deep dive into 2-3 components the interviewer picks. */
    DeepDive = "deepDive",
    /** Trade-offs, bottlenecks, and failure modes. */
    Tradeoffs = "tradeoffs",
}

export const GraphQLTypeMockInterviewPhase = createEnumType(
    MockInterviewPhase,
)

registerEnumType(
    GraphQLTypeMockInterviewPhase,
    {
        name: "MockInterviewPhase",
        description: "One of the five canonical mock interview phases.",
        valuesMap: {
            [MockInterviewPhase.Requirements]: {
                description: "Requirements clarification.",
            },
            [MockInterviewPhase.Estimation]: {
                description: "Estimation and API design.",
            },
            [MockInterviewPhase.HighLevel]: {
                description: "High-level architecture design.",
            },
            [MockInterviewPhase.DeepDive]: {
                description: "Deep dive into selected components.",
            },
            [MockInterviewPhase.Tradeoffs]: {
                description: "Trade-offs and failure modes.",
            },
        },
    },
)
