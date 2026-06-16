import {
    Module,
} from "@nestjs/common"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"
import {
    ConfigurableModuleClass,
} from "./search-users.module-definition"
import {
    SearchUsersResolver,
} from "./search-users.resolver"

/**
 * Leaf query module for `searchUsers` — free-text search over the Elasticsearch
 * `users` index. Imports the Elasticsearch module for the shared client.
 */
@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        SearchUsersResolver,
    ],
})
export class SearchUsersSingleQueryModule extends ConfigurableModuleClass {}
