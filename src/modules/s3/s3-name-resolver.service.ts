import {
    Locale 
} from "@modules/databases"
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
     * @param locale - The locale of the challenge.
     * @returns The name for the challenge.
     */
    challenge(id: string, locale?: Locale): string {
        if (locale) {
            return `challenges/${id}-${locale}.json`
        }
        return `challenges/${id}.json`
    }

    /**
     * Resolve the name for a course.
     * @param id - The id of the course.
     * @param locale - The locale of the course.
     * @returns The name for the course.
     */
    course(id: string, locale?: Locale): string {
        if (locale) {
            return `courses/${id}-${locale}.json`
        }
        return `courses/${id}.json`
    }

    /**
     * Resolve the name for a lesson video.
     * @param id - The id of the lesson video.
     * @param locale - The locale of the lesson video.
     * @returns The name for the lesson video.
     */
    lessonVideo(id: string, locale?: Locale): string {
        if (locale) {
            return `lesson-videos/${id}-${locale}.json`
        }
        return `lesson-videos/${id}.json`
    }

    /**
     * Resolve the name for a module.
     * @param id - The id of the module.
     * @param locale - The locale of the module.
     * @returns The name for the module.
     */
    module(id: string, locale?: Locale): string {
        if (locale) {
            return `modules/${id}-${locale}.json`
        }
        return `modules/${id}.json`
    }

    /**
     * Resolve the name for a content.
     * @param id - The id of the content.
     * @param locale - The locale of the content.
     * @returns The name for the content.
     */
    content(id: string, locale?: Locale): string {
        if (locale) {
            return `contents/${id}-${locale}.json`
        }
        return `contents/${id}.json`
    }
}