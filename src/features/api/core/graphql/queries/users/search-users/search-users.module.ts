import {
    Module,
} from "@nestjs/common"
import {
    ElasticsearchModule,
} from "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    ConfigurableModuleClass,
} from "./search-users.module-definition"
import {
    SearchUsersResolver,
} from "./search-users.resolver"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        SearchUsersResolver,
    ],
})
/**
 * Leaf query module for `searchUsers` -- free-text search over the Elasticsearch
 * `users` index. Imports the Elasticsearch module for the shared client.
 */
export class SearchUsersSingleQueryModule extends ConfigurableModuleClass {}
