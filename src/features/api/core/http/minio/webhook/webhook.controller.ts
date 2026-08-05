import {
    Body,
    Controller,
    HttpCode,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import {
    RestTransformInterceptor,
} from "@modules/api"
import {
    httpConfig,
} from "../../http"
import {
    MinioWebhookRequest,
} from "./dtos"
import {
    MinioWebhookService,
} from "./webhook.service"

@ApiTags("webhooks")
@Controller(
    {
        path: httpConfig().minio().tags,
        version: "1",
    },
)
/**
 * MinIO Bucket Notification HTTP controller.
 */
export class MinioWebhookController {
    constructor(
        private readonly minioWebhookService: MinioWebhookService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Webhook from MinIO",
        description: "Standard S3-compatible bucket notification to automate CV analysis triggers.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "Webhook processed successfully.",
        },
    )
    @Post(
        httpConfig().minio().webhook().path,
    )
    @HttpCode(200)
    async webhook(
        @Body()
            body: MinioWebhookRequest,
    ) {
        return this.minioWebhookService.execute(body)
    }
}
