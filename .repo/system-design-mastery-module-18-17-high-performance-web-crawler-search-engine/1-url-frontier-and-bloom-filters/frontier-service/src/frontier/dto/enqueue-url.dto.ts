import {
    IsIn,
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload dua URL vao frontier.
 * (EN: Payload that enqueues a URL into the frontier.)
 */
export class EnqueueUrlDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsIn(["low", "normal", "high"])
    priority!: "low" | "normal" | "high"
}
