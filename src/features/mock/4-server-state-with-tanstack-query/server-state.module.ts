import {
    Module,
} from "@nestjs/common"
import {
    UseQueryModule,
} from "./0-usequery-and-cache-lifecycle/usequery.module"
import {
    MutationsModule,
} from "./1-mutations-and-invalidation-graph/mutations.module"
import {
    OptimisticModule,
} from "./2-optimistic-updates-with-rollback/optimistic.module"
import {
    InfiniteModule,
} from "./3-infinite-query-and-pagination/infinite.module"

@Module({
    imports: [
        UseQueryModule.register({
            isGlobal: true,
        }),
        MutationsModule.register({
            isGlobal: true,
        }),
        OptimisticModule.register({
            isGlobal: true,
        }),
        InfiniteModule.register({
            isGlobal: true,
        }),
    ],
})
/** Aggregator module bundling every leaf mock for the server-state module. */
export class ServerStateMockModule {}
