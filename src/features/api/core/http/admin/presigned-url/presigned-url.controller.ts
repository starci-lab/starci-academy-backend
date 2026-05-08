import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger"
import {
    RestTransformInterceptor,
} from "@modules/api"
import {
    httpConfig,
} from "../../http"
import {
    PresignedUrlRequest,
} from "./dtos"
import {
    PresignedUrlService,
} from "./presigned-url.service"
import type {
    PresignedUrlItem,
} from "./presigned-url.command"

/**
 * Admin controller for generating presigned upload URLs.
 */
@ApiTags(httpConfig().admin().tags)
@Controller(
    {
        path: httpConfig().admin().tags,
        version: "1",
    },
)
export class PresignedUrlController {
    constructor(
        private readonly presignedUrlService: PresignedUrlService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Generate presigned upload URLs",
        description:
            "Returns presigned PUT URLs for both MinIO and DigitalOcean S3, " +
            "allowing direct browser-to-storage uploads.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "Presigned URLs generated successfully.",
        },
    )
    @Post(
        httpConfig().admin().presignedUrl().path,
    )
    @HttpCode(200)
    async presignedUrl(
        @Body()
            body: PresignedUrlRequest,
    ): Promise<Array<PresignedUrlItem>> {
        return this.presignedUrlService.execute({
            key: body.key,
            contentType: body.contentType,
        })
    }
}
