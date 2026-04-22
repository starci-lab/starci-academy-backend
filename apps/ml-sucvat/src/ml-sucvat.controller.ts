import {
    Controller, Get 
} from "@nestjs/common"
import {
    MlSucvatService 
} from "./ml-sucvat.service"

@Controller()
export class MlSucvatController {
    constructor(private readonly mlSucvatService: MlSucvatService) {}

  @Get()
    getHello(): string {
        return this.mlSucvatService.getHello()
    }
}
