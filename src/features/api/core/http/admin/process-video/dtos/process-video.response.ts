import {
    ApiProperty,
} from "@nestjs/swagger"

/**
 * Response DTO for process-video endpoint.
 */
export class ProcessVideoResponse {
    @ApiProperty({
        description: "The created BullMQ job ID.",
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    })
        jobId: string

    @ApiProperty({
        description: "Human-readable status message.",
        example: "Video processing job enqueued successfully.",
    })
        message: string
}
