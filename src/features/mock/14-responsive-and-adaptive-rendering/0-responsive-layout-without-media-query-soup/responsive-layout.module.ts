import {
    Module,
} from "@nestjs/common"
import {
    ResponsiveLayoutController,
} from "./responsive-layout.controller"

/** Leaf module for the responsive-layout lesson mock. */
@Module({
    controllers: [ResponsiveLayoutController],
})
export class ResponsiveLayoutMockModule {}
