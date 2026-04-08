import {
    Injectable 
} from "@nestjs/common"

/**
 * Service for resolving S3 names.
 */
@Injectable()
export class S3NameResolverService {
    constructor() { }

    /**
     * Resolve the name for a challenge.
     * @param id - The id of the challenge.
     * @returns The name for the challenge.
     */
    challenge(id: string): string {
        return `challenges/${id}.json`
    }

    /**
     * Resolve the name for a course.
     * @param id - The id of the course.
     * @returns The name for the course.
     */
    course(id: string): string {
        return `courses/${id}.json`
    }

    /**
     * Resolve the name for a lesson video.
     * @param id - The id of the lesson video.
     * @returns The name for the lesson video.
     */
    lessonVideo(id: string): string {
        return `lesson-videos/${id}.json`
    }

    /**
     * Resolve the name for a module.
     * @param id - The id of the module.
     * @returns The name for the module.
     */
    module(id: string): string {
        return `modules/${id}.json`
    }
}