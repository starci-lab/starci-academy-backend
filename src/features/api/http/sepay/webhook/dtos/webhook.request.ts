import {
    IsNumber,
    IsString,
    IsOptional,
} from "class-validator"
import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * SePay webhook request body.
 */
export class SepayWebhookRequest {
    @ApiProperty({
        description: "Transaction ID in SePay system",
    })
    @IsNumber()
        id: number

    @ApiProperty({
        description: "Amount transferred in",
    })
    @IsNumber()
        transferAmount: number

    @ApiProperty({
        description: "Transfer content which usually includes the order code",
    })
    @IsString()
        content: string

    @ApiProperty({
        description: "Bank code",
    })
    @IsString()
    @IsOptional()
        code?: string
}
