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
    UserCodingProblemDetailResponse
} from "./response"
@Resolver()
class Probe { @Query(() => UserCodingProblemDetailResponse) query(): UserCodingProblemDetailResponse { throw new Error("probe") } }
describe("UserCodingProblemDetailResponse schema contract",
    () => { let schema: GraphQLSchema; beforeAll(async () => { const m = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule]
    }).compile(); schema = await (await m.get(GraphQLSchemaFactory)).create([Probe]) }); it("builds reachable fields",
        () => { expect(schema.getQueryType()?.getFields()).toHaveProperty("query"); const type = schema.getType("UserCodingProblemDetailResponse"); expect(type).toBeDefined(); expect(type).toHaveProperty("getFields") }) })
