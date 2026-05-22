/**
 * Root module — ConfigModule + MongooseModule + UsersModule.
 * (EN: Root module — ConfigModule + MongooseModule + UsersModule.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    MongooseModule,
} from "@nestjs/mongoose"
import {
    appConfig,
    mongoConfig,
} from "./config"
import {
    UsersModule,
} from "./users"

@Module({
    imports: [
        // ConfigModule — load .env và đăng ký các config factory (registerAs).
        // (EN: ConfigModule — load .env and register config factories (registerAs).)
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, mongoConfig],
        }),
        // MongooseModule — kết nối MongoDB thông qua config namespace "mongo.uri".
        // (EN: MongooseModule — connect to MongoDB via config namespace "mongo.uri".)
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.getOrThrow<string>("mongo.uri"),
            }),
        }),
        UsersModule,
    ],
})
export class AppModule {}
