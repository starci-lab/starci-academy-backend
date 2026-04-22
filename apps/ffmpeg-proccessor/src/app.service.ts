import {
    Injectable 
} from "@nestjs/common"

@Injectable()
export class FfmpegServiceService {
    getHello(): string {
        return "Hello World!"
    }
}
