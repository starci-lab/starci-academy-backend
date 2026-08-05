import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import {
    ToolsTargetNotFoundException,
} from "@modules/exceptions"
import {
    LocalOnlyGuard,
} from "../guards"
import {
    toolsRoutes,
} from "../constants"
import {
    ToolsStoreService,
} from "../store"
import {
    CreateTargetRequest,
    UpdateTargetRequest,
} from "./dtos"

@ApiTags(toolsRoutes.targets.tag)
@UseGuards(LocalOnlyGuard)
@Controller(
    {
        path: toolsRoutes.targets.tag,
        version: "1",
    },
)
/**
 * Local-only controller for managing saved S3 targets (stored in SQLite).
 */
export class TargetsController {
    constructor(
        private readonly toolsStoreService: ToolsStoreService,
    ) {}

    @ApiOperation({
        summary: "Save a new S3 target",
    })
    @Post()
    @HttpCode(200)
    create(
        @Body()
            body: CreateTargetRequest,
    ) {
        // default to path-style which is the safe choice for MinIO/self-hosts
        return this.toolsStoreService.createTarget({
            name: body.name,
            endpoint: body.endpoint,
            region: body.region,
            accessKeyId: body.accessKeyId,
            secretAccessKey: body.secretAccessKey,
            bucket: body.bucket,
            forcePathStyle: body.forcePathStyle ?? true,
        })
    }

    @ApiOperation({
        summary: "List saved S3 targets (secrets redacted)",
    })
    @Get()
    list() {
        return this.toolsStoreService.listTargets()
    }

    @ApiOperation({
        summary: "Update a saved S3 target (e.g. fix credentials)",
    })
    @Patch(":id")
    @HttpCode(200)
    update(
        @Param("id")
            id: string,
        @Body()
            body: UpdateTargetRequest,
    ) {
        // merge the provided fields over the existing target
        const updated = this.toolsStoreService.updateTarget({
            id,
            ...body,
        })
        if (!updated) {
            throw new ToolsTargetNotFoundException({
                targetId: id,
            })
        }
        return updated
    }

    @ApiOperation({
        summary: "Delete a saved S3 target",
    })
    @Delete(":id")
    delete(
        @Param("id")
            id: string,
    ) {
        // surface a 404 when the id does not match any saved target
        const removed = this.toolsStoreService.deleteTarget(id)
        if (!removed) {
            throw new ToolsTargetNotFoundException({
                targetId: id,
            })
        }
        return {
            id,
            deleted: true,
        }
    }
}
