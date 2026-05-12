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
    ViewPresignedUrlRequest,
} from "./dtos"
import {
    ViewPresignedUrlService,
} from "./view-presigned-url.service"
import type {
    ViewPresignedUrlItem,
} from "./view-presigned-url.command"

/**
 * Admin controller for getting MPEG-DASH view URLs.
 */
@ApiTags(httpConfig().admin().tags)
@Controller(
    {
        path: httpConfig().admin().tags,
        version: "1",
    },
)
export class ViewPresignedUrlController {
    constructor(
        private readonly viewPresignedUrlService: ViewPresignedUrlService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Get MPEG-DASH manifest URLs for a processed video",
        description:
            "Returns direct public URLs to the manifest.mpd for both MinIO and DigitalOcean. " +
            "Use these URLs in a DASH player to stream the processed video.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "MPEG-DASH manifest URLs returned.",
        },
    )
    @Post(
        httpConfig().admin().viewPresignedUrl().path,
    )
    @HttpCode(200)
    async viewPresignedUrl(
        @Body()
            body: ViewPresignedUrlRequest,
    ): Promise<Array<ViewPresignedUrlItem>> {
        return this.viewPresignedUrlService.execute({
            assetId: body.assetId,
        })
    }
}
