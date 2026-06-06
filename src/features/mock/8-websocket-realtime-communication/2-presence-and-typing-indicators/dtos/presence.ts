import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString, IsNotEmpty, MaxLength,
} from "class-validator"

/** Payload for the `join` event. */
export class JoinDto {
    /** Display id of the joining user (multiple tabs share one userId). */
    @ApiProperty({
        description: "User id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
        userId: string

    /** Room to join. */
    @ApiProperty({
        description: "Room id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        roomId: string
}

/** Payload for the `typing` event. */
export class TypingDto {
    /** User id that is typing. */
    @ApiProperty({
        description: "User id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
        userId: string

    /** Room the typing indicator applies to. */
    @ApiProperty({
        description: "Room id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        roomId: string
}
