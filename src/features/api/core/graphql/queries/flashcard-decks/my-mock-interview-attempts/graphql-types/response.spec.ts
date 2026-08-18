import {
    Test,
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule,
    GraphQLSchemaFactory,
    Query,
    Resolver,
} from "@nestjs/graphql"
import type {
    GraphQLObjectType,
    GraphQLSchema,
} from "graphql"
import {
    MockInterviewAttemptAttributeScoreItem,
    MockInterviewAttemptItem,
    MockInterviewAttemptPhaseScoreItem,
    MockInterviewAttemptQuestionReviewItem,
    MyMockInterviewAttemptsData,
    MyMockInterviewAttemptsResponse,
} from "./response"

/**
 * Minimal resolver that exists only to give the schema factory an entry point
 * into the response tree. Code-first types are unreachable until something
 * returns them, so this is how the declared contract gets built at all.
 */
@Resolver()
class MyMockInterviewAttemptsProbeResolver {
    @Query(() => MyMockInterviewAttemptsResponse)
    /**
     * Probe query returning the response envelope under test.
     *
     * @returns never called -- only its declared return type is read.
     */
    myMockInterviewAttempts(): MyMockInterviewAttemptsResponse {
        throw new Error("probe resolver is never executed")
    }
}

/**
 * These are declaration-only GraphQL object types: every member is a plain
 * property whose only behaviour is the `@Field` contract it publishes. So the
 * assertion that carries weight is the BUILT SCHEMA -- field names, exact
 * scalar/enum/object types, list shape and nullability. `GraphQLSchemaFactory`
 * throws outright on an undeterminable output type, and flipping a `nullable`
 * or a list wrapper here is a breaking API change for every client.
 */
describe("myMockInterviewAttempts response types",
    () => {
        let schema: GraphQLSchema

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    GraphQLSchemaBuilderModule,
                ],
            }).compile()

            // ONE build for the whole file: the factory accumulates type metadata
            // across calls, so a second create() in the same process fails with a
            // duplicate-name error unrelated to the code under test.
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([
                MyMockInterviewAttemptsProbeResolver,
            ])
        })

        /**
         * Read one built object type's field map as `name -> printed GraphQL type`.
         *
         * @param name - The object type name in the built schema.
         * @returns the field map, keyed by field name.
         */
        const fieldsOf = (
            name: string,
        ): Record<string, string> => {
            const type = schema.getType(name) as GraphQLObjectType
            expect(type).toBeDefined()
            return Object.fromEntries(
                Object.values(type.getFields()).map(
                    (field) => [
                        field.name,
                        field.type.toString(),
                    ],
                ),
            )
        }

        it("exposes the query and every response type it reaches",
            () => {
                expect(schema.getQueryType()?.getFields())
                    .toHaveProperty("myMockInterviewAttempts")
                // each nested type is reachable, not merely declared in the file
                for (const name of [
                    "MyMockInterviewAttemptsResponse",
                    "MyMockInterviewAttemptsData",
                    "MockInterviewAttemptItem",
                    "MockInterviewAttemptPhaseScoreItem",
                    "MockInterviewAttemptAttributeScoreItem",
                    "MockInterviewAttemptQuestionReviewItem",
                ]) {
                    expect(schema.getType(name)).toBeDefined()
                }
            })

        it("keeps the envelope's data nullable so a failed op can drop the payload",
            () => {
                expect(fieldsOf("MyMockInterviewAttemptsResponse")).toEqual({
                    success: "Boolean!",
                    message: "String!",
                    error: "String",
                    // nullable on purpose: the transform interceptor nulls data on error
                    data: "MyMockInterviewAttemptsData",
                })
            })

        it("pages the history with a total count independent of the page",
            () => {
                expect(fieldsOf("MyMockInterviewAttemptsData")).toEqual({
                    totalCount: "Int!",
                    items: "[MockInterviewAttemptItem!]!",
                })
            })

        it("publishes an attempt with its pre-mode-split fields left nullable",
            () => {
                expect(fieldsOf("MockInterviewAttemptItem")).toEqual({
                    id: "ID!",
                    sessionId: "ID!",
                    promptId: "ID!",
                    promptTitle: "String!",
                    // null == "any level"
                    level: "String",
                    // null == graded before the qna/design split
                    mode: "String",
                    overallScore: "Int!",
                    verdict: "String!",
                    phaseScores: "[MockInterviewAttemptPhaseScoreItem!]!",
                    attributeScores: "[MockInterviewAttemptAttributeScoreItem!]!",
                    strengths: "[String!]!",
                    gaps: "[String!]!",
                    // null == no follow-up was produced
                    followUpQuestion: "String",
                    matchedContentIds: "[String!]!",
                    questionReviews: "[MockInterviewAttemptQuestionReviewItem!]!",
                    createdAt: "String!",
                    // null == the learner never named the session
                    name: "String",
                })
            })

        it("publishes the per-phase and per-attribute score breakdowns",
            () => {
                expect(fieldsOf("MockInterviewAttemptPhaseScoreItem")).toEqual({
                    phase: "String!",
                    score: "Int!",
                    max: "Int!",
                })
                expect(fieldsOf("MockInterviewAttemptAttributeScoreItem")).toEqual({
                    key: "String!",
                    score: "Int!",
                })
            })

        it("publishes the per-question review with only its unmatched fields nullable",
            () => {
                expect(fieldsOf("MockInterviewAttemptQuestionReviewItem")).toEqual({
                    questionIndex: "Int!",
                    kind: "String!",
                    question: "String!",
                    candidateAnswer: "String!",
                    // null == the seed flashcard had no authored model answer
                    modelAnswer: "String",
                    feedback: "String!",
                    score: "Int!",
                    max: "Int!",
                    // null == no confident lesson match
                    matchedContentId: "String",
                })
            })

        it("keeps every exported class reachable from the built schema",
            () => {
                // guards against a class being exported but wired to nothing -- the
                // failure mode that only shows up as a boot error in production
                const exported = [
                    MyMockInterviewAttemptsResponse,
                    MyMockInterviewAttemptsData,
                    MockInterviewAttemptItem,
                    MockInterviewAttemptPhaseScoreItem,
                    MockInterviewAttemptAttributeScoreItem,
                    MockInterviewAttemptQuestionReviewItem,
                ]
                for (const cls of exported) {
                    expect(schema.getType(cls.name)).toBeDefined()
                }
            })
    })
