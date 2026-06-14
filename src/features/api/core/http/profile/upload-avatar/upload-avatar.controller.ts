import {
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
    RestTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthRestGuard,
    KeycloakRestUser,
} from "@modules/keycloak"
import {
    UserEntity,
} from "@modules/databases"
import {
    httpConfig,
} from "../../http"
import {
    UploadAvatarService,
} from "./upload-avatar.service"
import type {
    MulterFile,
    UploadAvatarResult,
} from "./types"

/**
 * Authenticated controller for uploading the current user's avatar.
 *
 * Accepts a single multipart `file` field, stores it in S3 and persists the
 * resulting public URL on the user. The binary lives here (GraphQL is not wired
 * for uploads); `updateProfile` then references the returned URL.
 */
@ApiTags(httpConfig().profile().tags)
@Controller(
    {
        path: httpConfig().profile().tags,
        version: "1",
    },
)
export class UploadAvatarController {
    constructor(
        private readonly uploadAvatarService: UploadAvatarService,
    ) {}

    @UseGuards(KeycloakAuthRestGuard)
    @UseInterceptors(
        RestTransformInterceptor,
        FileInterceptor("file"),
    )
    @ApiOperation({
        summary: "Upload the current user's avatar",
        description:
            "Accepts a single multipart image (field \"file\"), stores it in S3 " +
            "and returns the public URL (also saved on the user).",
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
            },
        },
    })
    @ApiResponse(
        {
            status: 200,
            description: "Avatar uploaded and persisted successfully.",
        },
    )
    @Post(
        httpConfig().profile().uploadAvatar().path,
    )
    @HttpCode(200)
    async uploadAvatar(
        @UploadedFile()
            file: MulterFile | undefined,
        @KeycloakRestUser()
            user: UserEntity,
    ): Promise<UploadAvatarResult> {
        return this.uploadAvatarService.execute({
            user,
            file,
        })
    }
}
