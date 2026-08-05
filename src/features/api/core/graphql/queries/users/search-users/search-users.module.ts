import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./search-users.module-definition"
import {
    SearchUsersResolver,
} from "./search-users.resolver"

@Module({
    providers: [
        SearchUsersResolver,
    ],
})
/**
 * Leaf query module for `searchUsers` -- free-text search over the Elasticsearch
 * `users` index. Imports the Elasticsearch module for the shared client.
 */
export class SearchUsersSingleQueryModule extends ConfigurableModuleClass {}
