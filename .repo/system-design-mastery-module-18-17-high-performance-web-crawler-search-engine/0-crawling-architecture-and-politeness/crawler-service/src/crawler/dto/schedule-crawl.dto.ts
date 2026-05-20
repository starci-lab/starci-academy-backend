import {
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload len lich crawl mot URL.
 * (EN: Payload that schedules a URL crawl.)
 */
export class ScheduleCrawlDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsNotEmpty()
    userAgent!: string
}
