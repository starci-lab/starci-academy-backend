import {
    Field,
    InputType,
    Int,
    registerEnumType
} from "@nestjs/graphql"

/**
 * Which ES catalog index to fuzzy-search. Picking one index keeps results
 * homogeneous so the client can deep-link with a single parent-path shape.
 */
export enum IndexSearchType {
    /** Search the courses index -- hits are course rows (no module/content parent). */
    CourseIndex = "course-index",
    /** Search the modules index -- parent path includes the owning course. */
    ModuleIndex = "module-index",
    /** Search the contents (lessons) index -- parent path includes course + module. */
    ContentIndex = "content-index",
    /** Search the challenges index -- parent path includes course + module + content. */
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
/**
 * Input for `indexSearch`. `type` selects the ES index; an empty/whitespace
 * `query` short-circuits to zero hits without hitting ES.
 */
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
