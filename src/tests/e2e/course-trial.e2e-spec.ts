import request from "supertest"
import type {
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    ReactionService,
} from "@modules/bussiness/discussion/reaction.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    MarkAsReadedHandler,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.handler"
import {
    MarkAsReadedResolver,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.resolver"
import {
    MarkAsReadedService,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.service"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner touches a course without paying and receives a trial progress anchor.
 *
 * THE TRIAL IS A ROW, NOT A TIMER. There is no "start trial" mutation and no expiry: touching a
 * lesson creates an enrollment with `isEnrolled: false`, which anchors progress without unlocking
 * anything. The flow plan asked for start -> trial -> expiry, but the production source exposes no
 * trial-expiry door. This file therefore proves the implemented transport flow only: GraphQL lesson
 * activity creates one non-owning enrollment and persists progress against that same anchor.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner touches a course and gets a trial progress anchor",
    () => {
        let world: FlowWorld
        let currentUser: UserEntity | null = null

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let courseId: string
        let contentId: string
        let trialEnrollmentId: string

        const fakeAuthGuard = {
            canActivate: async (context: ExecutionContext): Promise<boolean> => {
                if (!currentUser) return false
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return Promise.resolve(true)
            },
        }

        const MARK_READ_MUTATION = `
            mutation MarkRead($request: MarkAsReadedRequest!) {
                markContentAsReaded(request: $request) { success error }
            }
        `

        beforeAll(async () => {
            jest.spyOn(KeycloakAuthGraphQLGuard.prototype,
                "canActivate").mockImplementation(fakeAuthGuard.canActivate)
            world = await bootFlowWorld({
                imports: [ApolloServerModule.register({
                    type: ApolloServerType.Monolithic,
                    useServices: false,
                })],
                providers: [
                    MarkAsReadedResolver,
                    MarkAsReadedService,
                    MarkAsReadedHandler,
                    // REAL: the trial row and the paid gate are the subject
                    UserService,
                    GraphQLEnrollmentGuard,
                    // the lesson's own side effects -- view counts and the progress rollup are
                    // proved by `content-progress`, and stubbing them keeps this flow about access
                    {
                        provide: ReactionService,
                        useValue: {
                            invalidateViewCount: jest.fn(),
                        },
                    },
                    {
                        provide: ProgressProjectionService,
                        useValue: {
                            recomputeForEnrollment: jest.fn(),
                            recompute: jest.fn(),
                            onContentRead: jest.fn(),
                        },
                    },
                    {
                        provide: KeycloakAuthGraphQLGuard, useValue: fakeAuthGuard
                    },
                    {
                        provide: KeycloakJwksService, useValue: {
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                        }
                    },
                ],
            })

            await world.truncate(
                "user_contents",
                "transaction_items",
                "transactions",
                "enrollments",
                "contents",
                "modules",
                "courses",
                "users",
            )

            const learner = await world.mintLearner("course-trial")
            learnerId = learner.id
            currentUser = learner

            const course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "course-trial-flow",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            courseId = course.id
            const courseModule = await world.entityManager.save(
                world.entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "course-trial-module",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const content = await world.entityManager.save(
                world.entityManager.create(ContentEntity,
                    {
                        title: "Intro Lesson",
                        displayId: "course-trial-lesson",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
            contentId = content.id
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
        })

        it("owns nothing before touching anything",
            async () => {
                const enrolments = await world.entityManager.count(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                        },
                    })
                expect(enrolments).toBe(0)
            })

        it("opens a trial enrolment the moment a lesson is touched",
            async () => {
                const response = await request(world.app.getHttpServer())
                    .post("/graphql")
                    .set("x-course-id",
                        courseId)
                    .send({
                        query: MARK_READ_MUTATION,
                        variables: {
                            request: {
                                contentId, readed: true, silent: true
                            }
                        },
                    })
                expect(response.status).toBe(200)
                expect(response.body.errors).toBeUndefined()

                const enrolment = await world.entityManager.findOneOrFail(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    })
                trialEnrollmentId = enrolment.id

                // a TRIAL row: it exists so progress has something to hang off, and that is all
                expect(enrolment.isEnrolled).toBe(false)
            })

        it("still unlocks nothing, because a trial row is not ownership",
            async () => {
                /*
                 * THE WHOLE RISK IN ONE ASSERTION. The trial row and the paid row are the same
                 * table; the only thing separating a reader from a customer is one boolean. If a
                 * gate ever checks "has an enrollment" instead of "is_enrolled = true", the course
                 * becomes free to anyone who clicks a lesson -- and nothing else in the system
                 * would look wrong.
                 */
                const enrollment = await world.entityManager.findOneByOrFail(EnrollmentEntity,
                    {
                        id: trialEnrollmentId,
                    })
                expect(enrollment.isEnrolled).toBe(false)
            })

        it("records the reading against that trial enrolment",
            async () => {
                const progress = await world.entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: learnerId,
                            contentId,
                        },
                        relations: {
                            enrollment: true,
                        },
                    })
                expect(progress.isRead).toBe(true)
                // keyed by enrollment, which is what makes the next step matter
                expect(progress.enrollment?.id).toBe(trialEnrollmentId)
            })

    })
