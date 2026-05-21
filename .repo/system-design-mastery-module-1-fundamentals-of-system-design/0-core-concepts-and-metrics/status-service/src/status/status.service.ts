/**
 * Service lesson — health + hostname cho demo LB.
 * (EN: Lesson service — health + hostname for LB demo.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import * as os from "os"

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name)

    /**
     * Logic — trả health và hostname container/pod.
     * Code — `os.hostname()` + object JSON response.
     * (EN Logic: Return health and container/pod hostname.)
     * (EN Code: `os.hostname()` + JSON body.)
     */
    getStatus(): { status: string; servedBy: string; timestamp: string } {
        const hostname = os.hostname()
        this.logger.log(`Request handled by: ${hostname}`)
        return { status: "ok", servedBy: hostname, timestamp: new Date().toISOString() }
    }
}
