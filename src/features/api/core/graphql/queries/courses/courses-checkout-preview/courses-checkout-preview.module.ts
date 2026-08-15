import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses-checkout-preview.module-definition"
import {
    CoursesCheckoutPreviewResolver,
} from "./courses-checkout-preview.resolver"
import {
    CoursesCheckoutPreviewService,
} from "./courses-checkout-preview.service"

@Module({
    providers: [
        CoursesCheckoutPreviewService,
        CoursesCheckoutPreviewResolver,
    ],
})
/**
 * Feature-module boundary for `coursesCheckoutPreview` -- re-provides the same
 * pricing helpers the real checkout charges with so the preview cannot drift.
 */
export class CoursesCheckoutPreviewSingleQueryModule extends ConfigurableModuleClass {}
