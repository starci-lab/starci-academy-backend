import {
    Module 
} from "@nestjs/common"
import {
    MlSucvatController 
} from "./ml-sucvat.controller"
import {
    MlSucvatService 
} from "./ml-sucvat.service"

@Module({
    imports: [],
    controllers: [MlSucvatController],
    providers: [MlSucvatService],
})
export class MlSucvatModule {}
