import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    JobReadinessResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => JobReadinessResponse) query(): JobReadinessResponse { throw new Error("probe") } }
import {
    JobReadinessData, JobReadinessTrackItem
} from "./response"
describe("job readiness response",
    () => { it("retains track progress and foundation status",
        () => { const track = Object.assign(new JobReadinessTrackItem(),
            {
                key: "frontend", title: "Frontend", completed: 3, total: 5
            }); const data = Object.assign(new JobReadinessData(),
            {
                tracks: [track], score: 60
            }); expect(data).toMatchObject({
            tracks: [{
                key: "frontend", completed: 3, total: 5
            }], score: 60
        }) }) })

describe("JobReadinessResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("JobReadinessResponse")).toBeDefined()
            })
    })
