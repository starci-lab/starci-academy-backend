import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    IsString, IsNotEmpty, MaxLength,
} from "class-validator"

/** Payload for the `joinRoom` event. */
export class JoinRoomDto {
    /** Room name to join. */
    @ApiProperty({
        description: "Room name.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
        room: string

    /** Display nickname for this client in the room. */
    @ApiProperty({
        description: "Display nickname.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(40)
        nickname: string
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

    /** Message text; the sender nickname comes from the join identity. */
    @ApiProperty({
        description: "Message text.",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
        text: string
}
