import {
    CapstoneCourseProgressObject, CapstoneTaskItemObject
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    UserCapstoneProgressResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => UserCapstoneProgressResponse) query(): UserCapstoneProgressResponse { throw new Error("probe") } }
describe("user capstone progress response DTOs",
    () => { it("reports passed task totals and nullable passedAt",
        () => { const task = Object.assign(new CapstoneTaskItemObject(),
            {
                taskGlobalId: "task1", title: "Ship", passed: false, score: 0, passedAt: null
            }); const course = Object.assign(new CapstoneCourseProgressObject(),
            {
                courseGlobalId: "course1", courseTitle: "Capstone", totalMilestones: 1, completedMilestones: 0, totalTasks: 1, completedTasks: 0, milestones: []
            }); expect({
            task, course
        }).toMatchObject({
            task: {
                passed: false, passedAt: null
            }, course: {
                totalTasks: 1, completedTasks: 0
            }
        }) }) })

describe("UserCapstoneProgressResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("UserCapstoneProgressResponse")).toBeDefined()
            })
    })
