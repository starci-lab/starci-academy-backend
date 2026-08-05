import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    createScyllaDBClientProvider,
} from "./scylladb.providers"
import {
    ScyllaConfigurableModuleClass,
    SCYLLADB_OPTIONS_TYPE,
} from "./scylladb.module-definition"
import {
    ScyllaDBService,
} from "./scylladb.service"

@Module({
})
/**
 * Module registering a shared ScyllaDB client.
 */
export class ScyllaDBModule extends ScyllaConfigurableModuleClass {
    static register(options: typeof SCYLLADB_OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const scyllaDBClientProvider = createScyllaDBClientProvider()

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                scyllaDBClientProvider,
                ScyllaDBService,
            ],
            exports: [
                scyllaDBClientProvider,
                ScyllaDBService,
            ],
        }
    }
}
