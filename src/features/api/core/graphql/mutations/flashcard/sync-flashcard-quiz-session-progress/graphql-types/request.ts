import {
    Field, ID, InputType, Int
} from "@nestjs/graphql"
import {
    ArrayMaxSize, IsArray, IsInt, IsString, IsUUID, Min, ValidateNested
} from "class-validator"
import {
    Type
} from "class-transformer"

@InputType()
/** One client assignment whose identifiers must both belong to the session snapshot. */
export class ClozeQuizSelectionRequest {
    @Field(() => ID)
    @IsString()
        blankId: string

    @Field(() => ID)
    @IsUUID()
        tokenId: string
}

@InputType({
    description: "Versioned replacement of a cloze quiz's current answer state."
})
/** Optimistic-concurrency input for replacing the current partial answer state. */
export class SyncFlashcardQuizSessionProgressRequest {
    @Field(() => ID)
    @IsUUID()
        sessionId: string

    @Field(() => Int)
    @IsInt()
    @Min(0)
        currentIndex: number

    @Field(() => Int)
    @IsInt()
    @Min(0)
        expectedVersion: number

    @Field(() => [ClozeQuizSelectionRequest])
    @IsArray()
    @ArrayMaxSize(100)
    @ValidateNested({
        each: true
    })
    @Type(() => ClozeQuizSelectionRequest)
        selections: Array<ClozeQuizSelectionRequest>
}
