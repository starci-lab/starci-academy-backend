import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import type {
    GraphQLSchema
} from "graphql"
import {
    CourseQuestionNodeObject
} from "./course-question-node.object"

@Resolver()
class CourseQuestionNodeObjectProbe {
    @Query(() => CourseQuestionNodeObject)
    query(): CourseQuestionNodeObject { throw new Error("schema probe") }
}

describe("course question node GraphQL contract",
    () => {
        let schema: GraphQLSchema
        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [GraphQLSchemaBuilderModule]
            }).compile()
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([CourseQuestionNodeObjectProbe])
        })
        it("builds the declared contract and executes lazy callbacks",
            () => {
                expect(schema.getType("CourseQuestionNodeObject")).toBeDefined()
                expect(schema.getQueryType() ?? schema.getMutationType()).toBeDefined()
            })
    })
