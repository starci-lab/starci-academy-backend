import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType()
export class IndexSearchParentPath {
    @Field(() => String, { nullable: true })
        courseDisplayId?: string

    @Field(() => String, { nullable: true })
        moduleDisplayId?: string

    @Field(() => String, { nullable: true })
        contentDisplayId?: string

    @Field(() => String, { nullable: true })
        challengeDisplayId?: string

    @Field(() => String, { nullable: true })
        lessonVideoDisplayId?: string
}

@ObjectType()
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
export class IndexSearchData {
    @Field(() => [IndexSearchItem])
        items: Array<IndexSearchItem>
}

@ObjectType()
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
