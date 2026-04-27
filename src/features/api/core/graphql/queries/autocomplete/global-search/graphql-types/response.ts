import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A single autocomplete item returned by global search.",
})
export class AutocompleteGlobalSearchItem {
    @Field(() => String)
        id: string

    @Field(() => String)
        displayId: string

    @Field(() => String)
        title: string

    @Field(
        () => [String],
        {
            description: "Highlight/snippet strings (may contain <em> tags from Elasticsearch).",
        },
    )
        texts: Array<string>
}

@ObjectType({
    description: "Grouped global search autocomplete results.",
})
export class AutocompleteGlobalSearchData {
    @Field(() => [AutocompleteGlobalSearchItem])
        courses: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        modules: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        challenges: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        lessonVideos: Array<AutocompleteGlobalSearchItem>

    @Field(() => [AutocompleteGlobalSearchItem])
        contents: Array<AutocompleteGlobalSearchItem>
}

@ObjectType({
    description: "Response wrapper for the global search autocomplete query.",
})
export class AutocompleteGlobalSearchResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<AutocompleteGlobalSearchData>
{
    @Field(
        () => AutocompleteGlobalSearchData,
        {
            nullable: true,
        },
    )
        data?: AutocompleteGlobalSearchData
}

