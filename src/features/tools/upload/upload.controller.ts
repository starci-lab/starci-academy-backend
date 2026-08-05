import {
    Body,
    Controller,
    HttpCode,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    FilesInterceptor,
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
    UploadService,
} from "./upload.service"
import type {
    MulterFile,
} from "../media"
import type {
    ProcessUploadResult,
} from "./types"

@ApiTags(toolsRoutes.upload.tag)
@Controller(
    {
        path: toolsRoutes.upload.tag,
        version: "1",
    },
)
/**
 * Local-only controller for raw file uploads to one or more S3 targets.
 */
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @UseInterceptors(
        // accept up to 20 files under the "files" field
        FilesInterceptor("files",
            20),
    )
    @ApiOperation({
        summary: "Upload raw file(s) to one or more S3 targets",
        description:
            "Stores each file locally (kept as a re-syncable artifact) and pushes it " +
            "as-is to every chosen target — e.g. local + prod MinIO at once. " +
            "Local-only: returns 404 in production.",
    })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                files: {
                    type: "array",
                    items: {
                        type: "string",
                        format: "binary",
                    },
                },
                targetIds: {
                    type: "string",
                    description: "JSON array of saved target ids, e.g. [\"id1\",\"id2\"].",
                },
                keyPrefix: {
                    type: "string",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "Per-file upload + sync outcomes.",
    })
    @Post(toolsRoutes.upload.process)
    @HttpCode(200)
    async process(
        @UploadedFiles()
            files: Array<MulterFile> | undefined,
        @Body("targetIds")
            targetIds: string | undefined,
        @Body("keyPrefix")
            keyPrefix: string | undefined,
    ): Promise<ProcessUploadResult> {
        return this.uploadService.execute({
            files,
            targetIds: parseTargetIds(targetIds),
            keyPrefix,
        })
    }
}
