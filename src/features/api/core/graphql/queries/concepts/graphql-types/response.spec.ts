import type {
    GraphQLObjectType,
} from "graphql"
import {
    buildEntityGraphqlSchema,
} from "@tests/helpers/entity-graphql-schema"
import {
    ConceptDetailData,
} from "./response"

describe("ConceptDetailData GraphQL contract",
    () => {
        it("exposes the learner projection without private grading fields",
            async () => {
                const schema = await buildEntityGraphqlSchema([ConceptDetailData])
                const activity = schema.getType("ConceptActivityData") as GraphQLObjectType
                const fields = activity.getFields()
                expect(fields).toHaveProperty("options")
                expect(fields).not.toHaveProperty("answer")
                expect(fields).not.toHaveProperty("rubric")
                expect(fields).not.toHaveProperty("feedbackRelease")
                const option = schema.getType("ConceptActivityOptionData") as GraphQLObjectType
                expect(option.getFields()).not.toHaveProperty("isCorrect")
                expect(option.getFields()).not.toHaveProperty("explanation")
                const exercise = schema.getType("ConceptExerciseData") as GraphQLObjectType
                expect(exercise.getFields()).not.toHaveProperty("checks")
                expect(exercise.getFields()).not.toHaveProperty("files")
            })
    })
