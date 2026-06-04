/**
 * Users module — registers Mongoose schema and provides UsersService.
 */
import {
    Module,
} from "@nestjs/common"
import {
    MongooseModule,
} from "@nestjs/mongoose"
import {
    User,
    UserSchema,
} from "./schemas"
import {
    UsersService,
} from "./users.service"
import {
    UsersController,
} from "./users.controller"

@Module({
    imports: [
                // Register User schema with Mongoose (collection "users").
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
