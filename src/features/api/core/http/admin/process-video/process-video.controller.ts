import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiHeader,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger"
import {
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"
import {
    AdminServiceTokenGuard,
} from "@modules/bussiness/guards/admin-access.guard"
import {
    httpConfig,
} from "../../http"
import {
    ProcessVideoRequest,
} from "./dtos/process-video.request"
import {
    ProcessVideoService,
} from "./process-video.service"
import type {
    ProcessVideoResult,
} from "./process-video.command"

@ApiTags(httpConfig().admin().tags)
@Controller(
    {
        path: httpConfig().admin().tags,
        version: "1",
    },
)
/**
 * Admin controller for enqueuing video processing jobs.
 */
export class ProcessVideoController {
    constructor(
        private readonly processVideoService: ProcessVideoService,
    ) { }

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @UseGuards(AdminServiceTokenGuard)
    @ApiHeader({
        name: "x-admin-api-key",
        description: "Admin API key for authentication.",
        required: true,
    })
    @ApiOperation({
        summary: "Enqueue video processing job",
        description:
            "Accepts a full S3 URL, downloads the video, encodes it via FFmpeg " +
            "to multi-bitrate, packages with Bento4 into MPEG-DASH, and uploads back to S3.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "Video processing job enqueued successfully.",
        },
    )
    @Post(
        httpConfig().admin().processVideo().path,
    )
    @HttpCode(200)
    async processVideo(
        @Body()
            body: ProcessVideoRequest,
    ): Promise<ProcessVideoResult> {
        return this.processVideoService.execute({
            url: body.url,
        })
    }
}
