import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType()
/**
 * Ancestor displayIds for an index-search hit. Only displayIds (not UUIDs) --
 * enough for slug-based URLs, unlike global-search which also returns ids.
 */
export class IndexSearchParentPath {
    @Field(() => String,
        {
            nullable: true 
        })
        courseDisplayId?: string

    @Field(() => String,
        {
            nullable: true 
        })
        moduleDisplayId?: string

    @Field(() => String,
        {
            nullable: true 
        })
        contentDisplayId?: string

    @Field(() => String,
        {
            nullable: true 
        })
        challengeDisplayId?: string
}

@ObjectType()
/**
 * One fuzzy hit from a single ES index, plus the cached parent displayIds
 * used to assemble a navigation URL.
 */
export class IndexSearchItem {
    @Field(() => String)
        id: string

    @Field(() => String)
        displayId: string

    @Field(() => String)
        title: string

    @Field(() => [String])
        texts: Array<string>

    @Field(
        () => IndexSearchParentPath,
        {
            nullable: true,
            description: "Parent graph from sync-indexer parent-index cache.",
        },
    )
        parentPath?: IndexSearchParentPath
}

@ObjectType()
/**
 * Flat hit list for one index. Unlike global search, results are not grouped
 * by kind -- the request already pinned the index.
 */
export class IndexSearchData {
    @Field(() => [IndexSearchItem])
        items: Array<IndexSearchItem>
}

@ObjectType()
/**
 * GraphQL envelope for `indexSearch`. `data` is null only on the error path;
 * a blank query still returns `{ items: [] }` inside `data`.
 */
export class IndexSearchResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<IndexSearchData>
{
    @Field(
        () => IndexSearchData,
        {
            nullable: true,
        },
    )
        data: IndexSearchData
}
