import {
    Body,
    Controller,
    HttpCode,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    FileInterceptor,
} from "@nestjs/platform-express"
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger"
import {
    LocalOnlyGuard,
} from "../guards"
import {
    toolsRoutes,
} from "../constants"
import {
    parseTargetIds,
} from "../utils"
import {
    MediaService,
} from "./media.service"
import type {
    MulterFile,
    ProcessMediaResult,
} from "./types"

/**
 * Local-only controller for encoding an uploaded video to MinIO.
 */
@ApiTags(toolsRoutes.media.tag)
@Controller(
    {
        path: toolsRoutes.media.tag,
        version: "1",
    },
)
export class MediaController {
    constructor(
        private readonly mediaService: MediaService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @UseInterceptors(
        FileInterceptor("file"),
    )
    @ApiOperation({
        summary: "Encode an uploaded video to multi-bitrate and upload to MinIO",
        description:
            "Accepts a single multipart video (field \"file\"), encodes it with FFmpeg " +
            "into 1080/720/480/360 renditions and uploads each to MinIO. " +
            "Local-only: returns 404 in production.",
    })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
                targetIds: {
                    type: "string",
                    description: "JSON array of saved target ids.",
                },
                keyPrefix: {
                    type: "string",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "The artifact id, local path, renditions and sync result.",
    })
    @Post(toolsRoutes.media.process)
    @HttpCode(200)
    async process(
        @UploadedFile()
            file: MulterFile | undefined,
        @Body("targetIds")
            targetIds: string | undefined,
        @Body("keyPrefix")
            keyPrefix: string | undefined,
    ): Promise<ProcessMediaResult> {
        return this.mediaService.execute({
            file,
            targetIds: parseTargetIds(targetIds),
            keyPrefix,
        })
    }
}
