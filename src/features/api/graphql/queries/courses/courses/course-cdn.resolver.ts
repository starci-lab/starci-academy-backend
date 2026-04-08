import {
    Parent,
    ResolveField,
    Resolver,
} from "@nestjs/graphql"
import {
    CourseEntity,
} from "@modules/databases"
import {
    S3BuildService,
} from "@modules/s3"

/**
 * Resolver for Course entity to handle secure CDN URLs.
 */
@Resolver(() => CourseEntity)
export class CourseCdnResolver {
    constructor(
        private readonly s3BuildService: S3BuildService,
    ) {}

    /**
     * Resolve the cdnUrl field to a time-limited pre-signed URL.
     */
    @ResolveField(() => String, {
        nullable: true,
        description: "Secure, time-limited pre-signed URL for the course JSON payload.",
    })
    async cdnUrl(
        @Parent() course: CourseEntity,
    ): Promise<string | null> {
        // The cdnUrl field now stores the S3 Object Key (e.g. 'courses-v2-uuid.json').
        const objectKey = course.cdnUrl
        
        if (!objectKey) {
            return null
        }

        // If it's already a full URL (legacy or external), return as is.
        if (objectKey.startsWith("http")) {
            return objectKey
        }

        // Generate a pre-signed URL for private objects.
        return this.s3BuildService.buildSignedGetObjectUrl(objectKey)
    }
}
