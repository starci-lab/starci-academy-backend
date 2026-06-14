import {
    Module 
} from "@nestjs/common"
import {
    EnrollWorker 
} from "./enroll.worker"
import {
    ConfigurableModuleClass 
} from "./enroll.module-definition"
import {
    StepMappingService 
} from "./step-mapping.service"
import {
    EnrollStepService
} from "./steps"
/**
 * Module for enrolling a user in a course.
 */
@Module({
    providers: [
        EnrollWorker,
        StepMappingService,
        EnrollStepService,
    ],
})
export class EnrollModule extends ConfigurableModuleClass {
}