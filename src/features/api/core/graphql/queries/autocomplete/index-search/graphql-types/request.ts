import {
    Field,
    InputType,
    Int,
    registerEnumType
    } from "@nestjs/graphql"

export enum IndexSearchType {
    CourseIndex = "course-index",
    ModuleIndex = "module-index",
    ContentIndex = "content-index",
    ChallengeIndex = "challenge-index",
    }

registerEnumType(IndexSearchType,
    {
        name: "IndexSearchType",
        description: "Target index type for fuzzy search."
    })

@InputType({
    description: "Fuzzy index-search request."
    })
export class IndexSearchRequest {
    @Field(
        () => IndexSearchType,
        {
            description: "Target index type."
    },
    )
        type: IndexSearchType

    @Field(
        () => String,
        {
            description: "Search keyword for fuzzy match."
    },
    )
        query: string

    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 10,
            description: "Maximum returned rows."
    },
    )
        size?: number
}
