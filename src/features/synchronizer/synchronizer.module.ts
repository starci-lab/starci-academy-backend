import {
    Module,
} from "@nestjs/common"
import type {
    DynamicModule,
} from "@nestjs/common"
import {
    CdnSynchronizerModule,
} from "./cdn-synchronizer"
import {
    ElasticsearchSynchronizerModule,
} from "./elasticsearch-synchronizer"
import {
    ScyllaDBSynchronizerModule,
} from "./scylladb-synchronizer"

@Module({})
export class SynchronizerModule {
    static register(
        {
            isGlobal = false,
        }: {
            isGlobal?: boolean
        } = {}
    ): DynamicModule {
        return {
            global: isGlobal,
            module: SynchronizerModule,
            imports: [
                CdnSynchronizerModule.register(
                    { isGlobal }
                ),
                ElasticsearchSynchronizerModule.register(
                    { isGlobal }
                ),
                ScyllaDBSynchronizerModule.register(
                    { isGlobal }
                ),
            ],
        }
    }
}
