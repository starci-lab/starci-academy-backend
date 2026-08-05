import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
    IsOptional,
    IsUUID,
    Max,
    Min,
} from "class-validator"

@InputType({
    description: "Request to grade a flashcard (SM-2).",
})
/**
 * Request to grade one flashcard in the spaced-repetition flow.
 */
export class ReviewFlashcardRequest {
    @Field(
        () => ID,
        {
            description: "The flashcard card id being graded.",
        },
    )
        cardId: string

    @Field(
        () => Int,
        {
            description: "SM-2 grade: 0=Again, 1=Hard, 2=Good, 3=Easy.",
        },
    )
    // reject out-of-range grades before they reach the SM-2 math
    @IsInt()
    @Min(0)
    @Max(3)
        grade: number

    @Field(
        () => ID,
        {
            nullable: true,
            description: "The review session this grade belongs to, so the event is attributed to the session for per-session stats. Omit for an untracked grade.",
        },
    )
    // when present it must be a real session uuid; absent → the event's sessionId stays null
    @IsOptional()
    @IsUUID()
        sessionId?: string | null
}
