import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    CourseEntity,
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    FlashcardDeckEntity,
    MilestoneEntity,
    FoundationEntity,
} from "@modules/databases"

/** Request for global search autocomplete query. */
@InputType({
    description: "Global search autocomplete request.",
})
export class AutocompleteGlobalSearchRequest {
    @Field(
        () => String,
        {
            description: "Search term (as-you-type).",
        },
    )
        query: string

    @Field(
        () => [String],
        {
            nullable: true,
            description: "Entity kinds to search (entity class names). Defaults to all.",
            defaultValue: [
                CourseEntity.name,
                ModuleEntity.name,
                ChallengeEntity.name,
                ContentEntity.name,
                FlashcardDeckEntity.name,
                MilestoneEntity.name,
                FoundationEntity.name,
            ],
        },
    )
        entities?: Array<string>

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max results per entity group.",
        },
    )
        size?: number
}

