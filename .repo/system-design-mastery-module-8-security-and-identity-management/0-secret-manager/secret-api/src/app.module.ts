/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VaultService } from './vault';

import { User } from "./entities";
import { UsersModule } from './users';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
    UsersModule,
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        // Fetch the password dynamically from Vault at startup
        const dbPassword = await VaultService.fetchDatabasePassword();

        return {
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USER || 'admin',
          password: dbPassword,
          database: process.env.DB_NAME || 'userdb',
          entities: [User],
          synchronize: true, // Only for demo purposes
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, VaultService],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
