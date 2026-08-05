import {
    Injectable 
} from "@nestjs/common"

@Injectable()
/** Service to manage job rooms. */
export class JobRoomService {
    /** Get the name of a job room. */
    name(jobId: string) {
        return `job:${jobId}`
    }
}