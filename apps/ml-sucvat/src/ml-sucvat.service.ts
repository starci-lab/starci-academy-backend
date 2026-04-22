import {
    Injectable 
} from "@nestjs/common"

@Injectable()
export class MlSucvatService {
    getHello(): string {
        return "Hello World!"
    }
}
