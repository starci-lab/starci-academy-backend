import {
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload index mot tai lieu da crawl.
 * (EN: Payload that indexes a crawled document.)
 */
export class IndexDocumentDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsNotEmpty()
    title!: string

    @IsString()
    @IsNotEmpty()
    html!: string
}
