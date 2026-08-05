import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./blog-posts.module-definition"
import {
    BlogPostsResolver,
} from "./blog-posts.resolver"

@Module({
    providers: [
        BlogPostsResolver,
    ],
})
/**
 * Wires the public `blogPosts` listing (newest first, optional pillar
 * filter). Resolver-only -- bodies are omitted so the `/blog` grid stays
 * light; detail fetches the full article.
 */
export class BlogPostsSingleQueryModule extends ConfigurableModuleClass {}
