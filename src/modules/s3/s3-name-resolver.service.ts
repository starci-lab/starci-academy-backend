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
}