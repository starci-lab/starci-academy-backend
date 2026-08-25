import {
    AutocompleteGlobalSearchData, AutocompleteGlobalSearchItem
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    AutocompleteGlobalSearchResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => AutocompleteGlobalSearchResponse) query(): AutocompleteGlobalSearchResponse { throw new Error("probe") } }
describe("autocomplete global search response DTOs",
    () => { it("supports sparse parent paths and kind-specific nullable flags",
        () => { const item = Object.assign(new AutocompleteGlobalSearchItem(),
            {
                id: "c1", displayId: "course", title: "Course", texts: ["<em>Course</em>"], parentPath: undefined, path: null, isEnrolled: true, isFree: false, isPremium: null
            }); const data = Object.assign(new AutocompleteGlobalSearchData(),
            {
                courses: [item], modules: [], challenges: [], contents: [], flashcardDecks: [], milestones: [], milestoneTasks: [], foundations: []
            }); expect(data).toMatchObject({
            courses: [{
                path: null, isEnrolled: true
            }], modules: [], foundations: []
        }) }) })

describe("AutocompleteGlobalSearchResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("AutocompleteGlobalSearchResponse")).toBeDefined()
            })
    })
