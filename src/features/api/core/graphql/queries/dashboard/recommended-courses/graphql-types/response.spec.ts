import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    RecommendedCoursesResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => RecommendedCoursesResponse) query(): RecommendedCoursesResponse { throw new Error("probe") } }
import {
    RecommendedCourseObject, RecommendedCoursesData
} from "./response"
describe("recommended courses response",
    () => { it("keeps recommendation reason and course identity",
        () => { const course = Object.assign(new RecommendedCourseObject(),
            {
                id: "c1", displayId: "intro", title: "Intro", reason: "popular"
            }); const data = Object.assign(new RecommendedCoursesData(),
            {
                courses: [course]
            }); expect(data).toMatchObject({
            courses: [{
                displayId: "intro", reason: "popular"
            }]
        }) }) })

describe("RecommendedCoursesResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("RecommendedCoursesResponse")).toBeDefined()
            })
    })
