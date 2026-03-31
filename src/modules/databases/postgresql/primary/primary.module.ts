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
    ContentEntity,
    ContentTranslationEntity,
    CourseEntity,
    CourseTranslationEntity,
    OutcomeTranslationEntity,
    PreviewContentEntity,
    PreviewContentTranslationEntity,
    PricingPhaseEntity,
    PrerequisiteEntity,
    PrerequisiteTranslationEntity,
    QnaEntity,
    QnaTranslationEntity,
    LessonVideoEntity,
    JobEntity,
    ModuleEntity,
    ModuleTranslationEntity,
    OutcomeEntity,
    TransactionEntity,
    EnrollmentEntity,
    ResourceEntity,
    SubmissionEntity,
    UserEntity,
    ValuePropositionEntity,
    ValuePropositionTranslationEntity,
} from "./entities"
import {
    SeedersModule 
} from "./seeders"

/**
 * Primary PostgreSQL module for the primary PostgreSQL connection.
 */
@Module({
})
export class PrimaryPostgreSQLModule extends ConfigurableModuleClass {
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
                                    ValuePropositionEntity,
                                    ValuePropositionTranslationEntity,
                                    CourseEntity,
                                    CourseTranslationEntity,
                                    PricingPhaseEntity,
                                    PrerequisiteEntity,
                                    PrerequisiteTranslationEntity,
                                    QnaEntity,
                                    QnaTranslationEntity,
                                    JobEntity,
                                    ModuleEntity,
                                    ModuleTranslationEntity,
                                    ContentEntity,
                                    ContentTranslationEntity,
                                    PreviewContentEntity,
                                    PreviewContentTranslationEntity,
                                    LessonVideoEntity,
                                    OutcomeEntity,
                                    OutcomeTranslationEntity,
                                    TransactionEntity,
                                    EnrollmentEntity,
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
            module: PrimaryPostgreSQLModule,
            imports: [
                NestTypeOrmModule.forFeature(
                    [
                        UserEntity,
                        ValuePropositionEntity,
                        ValuePropositionTranslationEntity,
                        CourseEntity,
                        CourseTranslationEntity,
                        PricingPhaseEntity,
                        PrerequisiteEntity,
                        PrerequisiteTranslationEntity,
                        QnaEntity,
                        QnaTranslationEntity,
                        JobEntity,
                        ModuleEntity,
                        ModuleTranslationEntity,
                        ContentEntity,
                        ContentTranslationEntity,
                        PreviewContentEntity,
                        PreviewContentTranslationEntity,
                        LessonVideoEntity,
                        OutcomeEntity,
                        OutcomeTranslationEntity,
                        TransactionEntity,
                        EnrollmentEntity,
                        ResourceEntity,
                        SubmissionEntity,
                    ], 
                    POSTGRESQL_PRIMARY
                ),
            ],
        }
    }
}
