import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./blog-post.module-definition"
import {
    BlogPostResolver,
} from "./blog-post.resolver"

@Module({
    providers: [
        BlogPostResolver,
    ],
})
/**
 * Wires the public `blogPost` article query (by slug). Resolver-only —
 * premium posts are truncated here so non-members hit the paywall.
 */
export class BlogPostSingleQueryModule extends ConfigurableModuleClass {}
