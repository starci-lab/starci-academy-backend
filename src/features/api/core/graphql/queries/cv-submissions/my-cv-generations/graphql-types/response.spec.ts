import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyCvGenerationsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyCvGenerationsResponse) query(): MyCvGenerationsResponse { throw new Error("probe") } }
import {
    CvGenerationListItem
} from "./response"
describe("CV generations response",
    () => { it("projects generation status and download metadata",
        () => { const item = Object.assign(new CvGenerationListItem(),
            {
                id: "g1", status: "completed", downloadUrl: null, createdAt: new Date()
            }); expect(item).toMatchObject({
            id: "g1", status: "completed", downloadUrl: null
        }) }) })

describe("MyCvGenerationsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyCvGenerationsResponse")).toBeDefined()
            })
    })
