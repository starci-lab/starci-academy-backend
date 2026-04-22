import {
    Injectable 
} from "@nestjs/common"

@Injectable()
export class ScriptsService {
    getHello(): string {
        return "Hello World!"
    }
}
