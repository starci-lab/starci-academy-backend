import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"

@InputType({
    description: "Global search autocomplete request.",
})
/** Request for global search autocomplete query. */
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

