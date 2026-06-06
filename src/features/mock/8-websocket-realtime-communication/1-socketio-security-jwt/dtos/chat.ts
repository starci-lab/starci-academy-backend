import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString, IsNotEmpty, MaxLength,
} from "class-validator"

/** Payload for the `joinRoom` event. */
export class JoinRoomDto {
    /** Room name to join within this lesson namespace. */
    @ApiProperty({
        description: "Room name.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        room: string
}

/** Payload for the `chatToServer` event. */
export class ChatToServerDto {
    /** Room to broadcast into. */
    @ApiProperty({
        description: "Target room name.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        room: string

    /** Message text; the sender identity is taken from the JWT, not this body. */
    @ApiProperty({
        description: "Message text.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
        text: string
}
