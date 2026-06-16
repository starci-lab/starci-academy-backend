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
export class BlogPostsSingleQueryModule extends ConfigurableModuleClass {}
