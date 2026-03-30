import {
    Module,
} from "@nestjs/common"
import {
    JobsModule,
} from "@modules/bussiness/jobs"
import {
    RequeueService,
} from "./requeue.service"

@Module({
    imports: [
        JobsModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        RequeueService,
    ],
})
export class RequeueModule {}

