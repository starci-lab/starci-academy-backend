import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    SystemHealthStatusResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => SystemHealthStatusResponse) query(): SystemHealthStatusResponse { throw new Error("probe") } }
import {
    ComponentHealthData, SystemHealthStatusResponseData
} from "./response"
describe("system health response",
    () => { it("reports component health and aggregate status",
        () => { const component = Object.assign(new ComponentHealthData(),
            {
                name: "db", status: "up", latencyMs: 5
            }); const data = Object.assign(new SystemHealthStatusResponseData(),
            {
                status: "healthy", components: [component]
            }); expect(data).toMatchObject({
            status: "healthy", components: [{
                name: "db", status: "up"
            }]
        }) }) })

describe("SystemHealthStatusResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("SystemHealthStatusResponse")).toBeDefined()
            })
    })
