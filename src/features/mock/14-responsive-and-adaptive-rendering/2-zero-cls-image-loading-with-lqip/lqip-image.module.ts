import {
    Module,
} from "@nestjs/common"
import {
    LqipImageController,
} from "./lqip-image.controller"

@Module({
    controllers: [LqipImageController],
})
/** Leaf module for the LQIP / zero-CLS image lesson mock. */
export class LqipImageMockModule {}
