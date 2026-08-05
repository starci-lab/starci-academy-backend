import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseGuards,
} from "@nestjs/common"
import {
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
    S3SnapshotRequest,
} from "./dtos"
import {
    S3SnapshotService,
} from "./s3-snapshot.service"
import type {
    S3SnapshotResult,
} from "./types"

@ApiTags(toolsRoutes.s3.tag)
@Controller(
    {
        path: toolsRoutes.s3.tag,
        version: "1",
    },
)
/**
 * Local-only controller for snapshotting a remote S3 bucket to local disk.
 */
export class S3SnapshotController {
    constructor(
        private readonly s3SnapshotService: S3SnapshotService,
    ) {}

    @UseGuards(LocalOnlyGuard)
    @ApiOperation({
        summary: "Snapshot a remote S3 bucket to local disk",
        description:
            "Lists every object of the given bucket/prefix and downloads each into " +
            "TOOLS_SNAPSHOT_DIR/s3/<bucket>, preserving the key hierarchy. The local " +
            "copy can then be synced up to another bucket. Local-only: 404 in production.",
    })
    @ApiResponse({
        status: 200,
        description: "Counts and the local directory the objects were written into.",
    })
    @Post(toolsRoutes.s3.snapshot)
    @HttpCode(200)
    async snapshot(
        @Body()
            body: S3SnapshotRequest,
    ): Promise<S3SnapshotResult> {
        return this.s3SnapshotService.execute({
            endpoint: body.endpoint,
            region: body.region,
            accessKeyId: body.accessKeyId,
            secretAccessKey: body.secretAccessKey,
            bucket: body.bucket,
            prefix: body.prefix,
            forcePathStyle: body.forcePathStyle,
        })
    }
}
