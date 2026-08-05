import {
    Module,
} from "@nestjs/common"
import {
    ResponsiveLayoutController,
} from "./responsive-layout.controller"

@Module({
    controllers: [ResponsiveLayoutController],
})
/** Leaf module for the responsive-layout lesson mock. */
export class ResponsiveLayoutMockModule {}
