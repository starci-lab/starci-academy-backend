import {
    Module,
} from "@nestjs/common"
import {
    UseQueryModule,
} from "./0-usequery-and-cache-lifecycle"
import {
    MutationsModule,
} from "./1-mutations-and-invalidation-graph"
import {
    OptimisticModule,
} from "./2-optimistic-updates-with-rollback"
import {
    InfiniteModule,
} from "./3-infinite-query-and-pagination"

/** Aggregator module bundling every leaf mock for the server-state module. */
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
export class ServerStateMockModule {}
