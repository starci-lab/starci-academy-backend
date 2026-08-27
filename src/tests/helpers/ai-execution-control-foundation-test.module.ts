import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    AiExecutionControlService,
} from "@modules/ai/control-plane/ai-execution-control.service"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"

@Module({
})
/** Synthetic composition root that is intentionally unreachable from production apps. */
export class AiExecutionControlFoundationTestModule {
    /** Bind the dark control service to one disposable named-primary manager. */
    static register(entityManager: EntityManager): DynamicModule {
        return {
            module: AiExecutionControlFoundationTestModule,
            providers: [
                {
                    provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                    useValue: entityManager,
                },
                AiExecutionControlService,
            ],
            exports: [AiExecutionControlService],
        }
    }
}
