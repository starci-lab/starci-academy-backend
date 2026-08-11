import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from "class-validator"

@InputType()
/** Input for one internal job application. */
export class ApplyToJobRequest {
    @Field(() => ID)
    @IsUUID()
        jobPostingId: string

    @Field(() => String,
        {
            nullable: true,
        })
    @IsOptional()
    @IsString()
    @MaxLength(10_000)
        coverLetter?: string
}
