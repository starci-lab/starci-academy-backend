import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    Type,
} from "class-transformer"
import {
    ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested,
} from "class-validator"

/** A single invoice line item in the request body. */
export class CreateInvoiceItemDto {
    /** Free-text description of the line item. */
    @ApiProperty({
        description: "Description of the line item.",
    })
    @IsString()
    @IsNotEmpty()
        description: string

    /** Quantity ordered (positive integer). */
    @ApiProperty({
        description: "Quantity ordered (>= 1).",
    })
    @IsInt()
    @Min(1)
        quantity: number

    /** Unit price (non-negative). */
    @ApiProperty({
        description: "Unit price (>= 0).",
    })
    @IsNumber()
    @Min(0)
        unitPrice: number
}

/** Request body for creating an invoice (dynamic-fields lesson). */
export class CreateInvoiceDto {
    /** Customer name the invoice is addressed to. */
    @ApiProperty({
        description: "Customer name.",
    })
    @IsString()
    @IsNotEmpty()
        customer: string

    /** Line items used to compute the invoice total (at least one). */
    @ApiProperty({
        description: "Invoice line items.", type: [CreateInvoiceItemDto],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({
        each: true,
    })
    @Type(() => CreateInvoiceItemDto)
        items: Array<CreateInvoiceItemDto>
}
