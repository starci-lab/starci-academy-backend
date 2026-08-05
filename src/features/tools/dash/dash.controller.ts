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
    DashService,
} from "./dash.service"
import type {
    MulterFile,
} from "../media"
import type {
    ProcessDashResult,
} from "./types"

@ApiTags(toolsRoutes.dash.tag)
@Controller(
    {
        path: toolsRoutes.dash.tag,
        version: "1",
    },
)
/**
 * Local-only controller for packaging an uploaded video to MPEG-DASH.
 */
export class DashController {
    constructor(
        private readonly dashService: DashService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @UseInterceptors(
        FileInterceptor("file"),
    )
    @ApiOperation({
        summary: "Package an uploaded video to MPEG-DASH and sync to an S3 target",
        description:
            "Encodes the video to multi-bitrate, fragments + packages it into a DASH " +
            "manifest locally (kept as a re-syncable artifact), then uploads to the " +
            "given saved target. Local-only: returns 404 in production.",
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
        description: "The artifact id, local path, manifest key and sync result.",
    })
    @Post(toolsRoutes.dash.process)
    @HttpCode(200)
    async process(
        @UploadedFile()
            file: MulterFile | undefined,
        @Body("targetIds")
            targetIds: string | undefined,
        @Body("keyPrefix")
            keyPrefix: string | undefined,
    ): Promise<ProcessDashResult> {
        return this.dashService.execute({
            file,
            targetIds: parseTargetIds(targetIds),
            keyPrefix,
        })
    }
}
