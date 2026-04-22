import {
    Injectable 
} from "@nestjs/common"

/** Service to manage job rooms. */
@Injectable()
export class JobRoomService {
    /** Get the name of a job room. */
    name(jobId: string) {
        return `job:${jobId}`
    }
}