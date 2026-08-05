import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./blog.module-definition"
import {
    BlogPostsSingleQueryModule,
} from "./blog-posts"
import {
    BlogPostSingleQueryModule,
} from "./blog-post"

@Module({
    imports: [
        BlogPostsSingleQueryModule.register({
            isGlobal: true,
        }),
        BlogPostSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Blog query group -- the public `/blog` listing (`blogPosts`) and the single
 * article page (`blogPost`). Both read team-authored, mount-seeded posts.
 */
export class BlogQueriesModule extends ConfigurableModuleClass {}
