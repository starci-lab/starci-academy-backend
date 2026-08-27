import {
    Field, ID, InputType, Int
} from "@nestjs/graphql"
import {
    ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsOptional, IsUUID, Max, Min
} from "class-validator"

@InputType({
    description: "Start a server-owned cloze assessment for one course scope."
})
/** Versioned input that asks the server to select and snapshot eligible cloze cards. */
export class StartFlashcardQuizSessionRequest {
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

    @Field(() => ID)
    @IsUUID()
        startRequestId: string
}
