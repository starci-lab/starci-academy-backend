import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    TypeOrmModule as NestTypeOrmModule 
} from "@nestjs/typeorm"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./primary.module-definition"
import {
    envConfig 
} from "@modules/env"
import {
    POSTGRESQL_PRIMARY 
} from "./constants"
import {
    AdvancedContentEntity,
    AdvancedContentSectionEntity,
    ContentEntity,
    CourseEntity,
    PrerequisiteEntity,
    QnaEntity,
    ExclusiveLessonVideoEntity,
    GeneralContentEntity,
    GeneralContentSectionEntity,
    ModuleEntity,
    OutcomeEntity,
    ResourceEntity,
    SubmissionEntity,
    UserEntity 
} from "./entities"
import {
    SeedersModule 
} from "./seeders"

/**
 * Primary PostgreSQL module for the primary PostgreSQL connection.
 */
@Module({
})
export class PrimaryPostgresqlModule extends ConfigurableModuleClass {
    /**
     * Register.
     * @param options - Options.
     * @returns Dynamic module.
     */
    public static register(
        options: typeof OPTIONS_TYPE = {
        }
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const extraModules: Array<DynamicModule> = []
        if (options.withSeeders) {
            extraModules.push(
                SeedersModule.register(options.withSeeders)
            )
        }
        // If mongoose is a boolean, use it as the connectionFactory value
        return {
            ...dynamicModule,
            imports: [
                NestTypeOrmModule.forRootAsync(
                    {
                        name: POSTGRESQL_PRIMARY,
                        useFactory: async () => {
                            const { 
                                database, 
                                host, 
                                password, 
                                port, 
                                username 
                            } = envConfig().databases.postgresql.primary
                            return {
                                type: "postgres",
                                host,
                                port,
                                username,
                                password,
                                database,
                                entities: [
                                    UserEntity,
                                    CourseEntity,
                                    PrerequisiteEntity,
                                    QnaEntity,
                                    AdvancedContentEntity,
                                    AdvancedContentSectionEntity,
                                    GeneralContentEntity,
                                    GeneralContentSectionEntity,
                                    ModuleEntity,
                                    ContentEntity,
                                    ExclusiveLessonVideoEntity,
                                    OutcomeEntity,
                                    ResourceEntity,
                                    SubmissionEntity,
                                ],
                                synchronize: true,
                                logging: false,
                            }
                        },
                    }
                ),
                this.forFeature(),
                ...extraModules,
            ],
            exports: [
                ...extraModules, 
            ],
        }
    }

    /**
     * For feature.
     * @param options - Options.
     * @returns Dynamic module.
     */
    private static forFeature(
    ): DynamicModule {
        return {
            module: PrimaryPostgresqlModule,
            imports: [
                NestTypeOrmModule.forFeature(
                    [
                        UserEntity,
                        CourseEntity,
                        PrerequisiteEntity,
                        QnaEntity,
                        AdvancedContentEntity,
                        AdvancedContentSectionEntity,
                        GeneralContentEntity,
                        GeneralContentSectionEntity,
                        ModuleEntity,
                        ContentEntity,
                        ExclusiveLessonVideoEntity,
                        OutcomeEntity,
                        ResourceEntity,
                        SubmissionEntity,
                    ], 
                    POSTGRESQL_PRIMARY
                ),
            ],
        }
    }
}
