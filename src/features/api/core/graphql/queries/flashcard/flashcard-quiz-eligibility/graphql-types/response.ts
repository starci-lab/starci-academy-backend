import {
    ArgsType, Field, ID, Int, ObjectType
} from "@nestjs/graphql"
import {
    ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsOptional, IsUUID, Max, Min
} from "class-validator"
import {
    AbstractGraphQLResponse
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse
} from "@modules/api/apollo/server/types/graphql-response"

@ArgsType()
/** Authorized course/deck scope and desired assessment size. */
export class FlashcardQuizEligibilityArgs {
    @Field(() => ID)
    @IsUUID()
        courseId: string

    @Field(() => [ID],
        {
            nullable: true, defaultValue: []
        })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @ArrayUnique()
    @IsUUID("all",
        {
            each: true
        })
        deckIds?: Array<string>

    @Field(() => Int)
    @IsInt()
    @Min(1)
    @Max(10)
        requestedItemCount: number
}

@ObjectType()
/** Advisory eligible-card count; start rechecks inside its own transaction. */
export class FlashcardQuizEligibilityData {
    @Field(() => Int)
        eligibleCount: number

    @Field(() => Int)
        requestedCount: number

    @Field(() => Boolean)
        canStart: boolean

    @Field(() => String,
        {
            nullable: true
        })
        reason: string | null
}

@ObjectType()
/** GraphQL envelope for cloze eligibility. */
export class FlashcardQuizEligibilityResponse extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FlashcardQuizEligibilityData> {
    @Field(() => FlashcardQuizEligibilityData,
        {
            nullable: true
        })
        data: FlashcardQuizEligibilityData
}
