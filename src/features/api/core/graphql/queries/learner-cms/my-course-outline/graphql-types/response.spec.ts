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
    MyCourseOutlineChallenge,
    MyCourseOutlineCourse,
    MyCourseOutlineCurrentTask,
    MyCourseOutlineData,
    MyCourseOutlineLesson,
    MyCourseOutlineMilestone,
    MyCourseOutlineModule,
    MyCourseOutlineProgress,
    MyCourseOutlineResponse,
    MyCourseOutlineTask,
} from "./response"

/**
 * Minimal resolver that exists only to give the schema factory an entry point
 * into the response tree. Code-first types are unreachable until something
 * returns them, so this is how the declared contract gets built at all.
 */
@Resolver()
class MyCourseOutlineProbeResolver {
    @Query(() => MyCourseOutlineResponse)
    /**
     * Probe query returning the response envelope under test.
     *
     * @returns never called -- only its declared return type is read.
     */
    myCourseOutline(): MyCourseOutlineResponse {
        throw new Error("probe resolver is never executed")
    }
}

/**
 * These are declaration-only GraphQL object types: every member is a plain
 * property whose only behaviour is the `@Field` contract it publishes. So the
 * assertion that carries weight is the BUILT SCHEMA -- field names, exact
 * scalar/object types, list shape and nullability. `GraphQLSchemaFactory`
 * throws outright on an undeterminable output type, and flipping a `nullable`
 * or a list wrapper here is a breaking API change for every client.
 */
describe("myCourseOutline response types",
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
                MyCourseOutlineProbeResolver,
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
                expect(schema.getQueryType()?.getFields()).toHaveProperty("myCourseOutline")
                for (const cls of [
                    MyCourseOutlineResponse,
                    MyCourseOutlineData,
                    MyCourseOutlineCourse,
                    MyCourseOutlineModule,
                    MyCourseOutlineLesson,
                    MyCourseOutlineChallenge,
                    MyCourseOutlineMilestone,
                    MyCourseOutlineTask,
                    MyCourseOutlineProgress,
                    MyCourseOutlineCurrentTask,
                ]) {
                    expect(schema.getType(cls.name)).toBeDefined()
                }
            })

        it("keeps the envelope's data nullable so a failed op can drop the payload",
            () => {
                expect(fieldsOf("MyCourseOutlineResponse")).toEqual({
                    success: "Boolean!",
                    message: "String!",
                    error: "String",
                    data: "MyCourseOutlineData",
                })
            })

        it("publishes both resume pointers as the only nullable parts of the payload",
            () => {
                expect(fieldsOf("MyCourseOutlineData")).toEqual({
                    course: "MyCourseOutlineCourse!",
                    modules: "[MyCourseOutlineModule!]!",
                    milestones: "[MyCourseOutlineMilestone!]!",
                    progress: "MyCourseOutlineProgress!",
                    // null == nothing left to do
                    currentTask: "MyCourseOutlineCurrentTask",
                    // null == all content complete; never a milestone task
                    nextContentTask: "MyCourseOutlineCurrentTask",
                })
            })

        it("publishes the course identity used for routing and CDN lookups",
            () => {
                expect(fieldsOf("MyCourseOutlineCourse")).toEqual({
                    id: "ID!",
                    title: "String!",
                    displayId: "String!",
                })
            })

        it("publishes the module tree with its paywall flag and ordered lessons",
            () => {
                expect(fieldsOf("MyCourseOutlineModule")).toEqual({
                    id: "ID!",
                    title: "String!",
                    orderIndex: "Int!",
                    isPremium: "Boolean!",
                    lessons: "[MyCourseOutlineLesson!]!",
                })
            })

        it("publishes a lesson with its read flag, paywall flag and nullable difficulty",
            () => {
                expect(fieldsOf("MyCourseOutlineLesson")).toEqual({
                    id: "ID!",
                    displayId: "String!",
                    title: "String!",
                    minutesRead: "Int!",
                    // null == difficulty unset on the content row
                    difficulty: "String",
                    isPremium: "Boolean!",
                    isRead: "Boolean!",
                    challenges: "[MyCourseOutlineChallenge!]!",
                })
            })

        it("publishes a challenge with its overlaid progress, all non-null",
            () => {
                // every progress field defaults server-side, so none may be nullable
                expect(fieldsOf("MyCourseOutlineChallenge")).toEqual({
                    id: "ID!",
                    title: "String!",
                    difficulty: "String!",
                    maxScore: "Int!",
                    status: "String!",
                    lastScore: "Int!",
                    completed: "Boolean!",
                })
            })

        it("publishes the milestone tree and its capstone tasks",
            () => {
                expect(fieldsOf("MyCourseOutlineMilestone")).toEqual({
                    id: "ID!",
                    title: "String!",
                    orderIndex: "Int!",
                    tasks: "[MyCourseOutlineTask!]!",
                })
                expect(fieldsOf("MyCourseOutlineTask")).toEqual({
                    id: "ID!",
                    title: "String!",
                    // null == type unset on the milestone-task row
                    type: "String",
                    maxScore: "Int!",
                    completed: "Boolean!",
                    lastScore: "Int!",
                    numAttempts: "Int!",
                })
            })

        it("publishes the aggregate progress summary as seven non-null counters",
            () => {
                expect(fieldsOf("MyCourseOutlineProgress")).toEqual({
                    lessonsRead: "Int!",
                    lessonsTotal: "Int!",
                    challengesCompleted: "Int!",
                    challengesTotal: "Int!",
                    tasksCompleted: "Int!",
                    tasksTotal: "Int!",
                    completionPercent: "Int!",
                })
            })

        it("discriminates the resume pointer by kind, with milestoneId only sometimes set",
            () => {
                expect(fieldsOf("MyCourseOutlineCurrentTask")).toEqual({
                    kind: "String!",
                    id: "String!",
                    // null unless the target is a milestone task
                    milestoneId: "String",
                })
            })
    })
