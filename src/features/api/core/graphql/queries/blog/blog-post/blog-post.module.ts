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
export class BlogPostSingleQueryModule extends ConfigurableModuleClass {}
