import {
    AiModelChoiceData, AiModelsResponseData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    AiModelsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => AiModelsResponse) query(): AiModelsResponse { throw new Error("probe") } }
describe("AI models response DTOs",
    () => { it("keeps active model choice and gradable catalog",
        () => { const choice = Object.assign(new AiModelChoiceData(),
            {
                model: "local-chat", provider: "local"
            }); const data = Object.assign(new AiModelsResponseData(),
            {
                tier: "low", models: [], gradableModels: [{
                    model: choice.model, provider: choice.provider, category: "low", complimentary: true, available: true, supportedTasks: []
                }]
            }); expect(data).toMatchObject({
            tier: "low", gradableModels: [{
                model: "local-chat", complimentary: true, available: true
            }]
        }) }) })

describe("AiModelsResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("AiModelsResponse")).toBeDefined()
            })
    })
