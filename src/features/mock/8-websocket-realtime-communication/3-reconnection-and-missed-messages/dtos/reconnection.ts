import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString, IsNotEmpty, IsInt, Min, MaxLength,
} from "class-validator"

/** Payload for the `join` event. */
export class JoinDto {
    /** Room to join. */
    @ApiProperty({
        description: "Room id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        roomId: string

    /** User id that owns this connection. */
    @ApiProperty({
        description: "User id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
        userId: string
}

/** Payload for the `chat` event. */
export class ChatDto {
    /** Room to broadcast into. */
    @ApiProperty({
        description: "Room id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        roomId: string

    /** Message text; the sender id comes from the join identity. */
    @ApiProperty({
        description: "Message text.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
        text: string
}

/** Payload for the `replay-since` event, emitted right after reconnect. */
export class ReplaySinceDto {
    /** Room to replay history for. */
    @ApiProperty({
        description: "Room id.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        roomId: string

    /** Highest sequence number the client has already seen. */
    @ApiProperty({
        description: "Last sequence number the client has seen.",
    })
    @IsInt()
    @Min(0)
        lastSeq: number
}
