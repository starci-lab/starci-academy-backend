import type {
    ModuleEntity,
} from "../../../../../entities"
import {
    ChallengeDifficulty,
    Locale,
} from "../../../../../enums"
import {
    envConfig 
} from "@modules/env"
import {
    DeepPartial 
} from "typeorm"
import {
    buildModuleId, 
    CourseId, 
    buildLessonVideoId, 
    buildContentId, 
    readMetadataOrDefault, 
    readFileOrDefault, 
    buildPreviewContentId,
    buildContentReferenceId,
    buildChallengeId,
    buildChallengeInputId,
    buildChallengeReferenceId,
    buildChallengeStepId,
} from "../../../../utils"

export const fullstackMasteryModule1: DeepPartial<ModuleEntity> = {
    id: buildModuleId({
        courseId: CourseId.FullstackMastery,
        moduleIndex: 0,
    }),
    displayId: "backend-environment-nestjs-introduction",
    defaultLocale: Locale.En,
    title: "Backend Environment & NestJS Introduction",
    description:
        "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
    orderIndex: 0,
    lessonVideos: [
        {
            id: buildLessonVideoId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                lessonVideoIndex: 0,
            }),
            thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            title: "Backend Environment & NestJS Introduction",
            description: "Set    up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            durationMs: 5400000,
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: "Môi trường Backend & Giới thiệu NestJS",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value: "Thiết lập môi trường Node.js, cài đặt NestJS, hiểu Dependency Injection, Module System, Request Lifecycle, Exception Handling, Logging, Validation và cách xây dựng các API cơ bản.",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.En,
                    field: "title",
                    value: "Backend Environment & NestJS Introduction",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        lessonVideoIndex: 0,
                    }),
                    locale: Locale.En,
                    field: "description",
                    value: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
                },
            ],
        },
    ],
    challenges: [
        {
            id: buildChallengeId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                challengeIndex: 0,
            }),
            title: "Bootstrap a NestJS HTTP API",
            brief: [
                "**Objective:** add a minimal controller that returns JSON from a health route.",
                "",
                "_Prerequisites:_ Node.js LTS and the Nest CLI (`npm i -g @nestjs/cli`).",
            ].join("\n"),
            description:
                "Create a NestJS application with a single controller exposing `GET /health` that returns a small JSON object. Verify the server starts without errors.",
            orderIndex: 0,
            difficulty: ChallengeDifficulty.Easy,
            defaultLocale: Locale.En,
            module: {
                id: buildModuleId({
                    courseId: CourseId.FullstackMastery,
                    moduleIndex: 0,
                }),
            },
            inputs: [
                {
                    id: buildChallengeInputId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                        inputIndex: 0,
                    }),
                    description: "Describe how you verified the endpoint responds (e.g. curl path or status code).",
                    orderIndex: 0,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: buildChallengeId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            challengeIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            challengeInputId: buildChallengeInputId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                inputIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "description",
                            value: "Mô tả cách bạn kiểm tra endpoint (ví dụ: lệnh curl hoặc mã trạng thái HTTP).",
                        },
                    ],
                },
            ],
            steps: [
                {
                    id: buildChallengeStepId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                        stepIndex: 0,
                    }),
                    title: "Scaffold the NestJS app",
                    description:
                        "Create a new NestJS project with the CLI (`nest new`) or use the course starter. Run the dev server and confirm it listens on the expected port.",
                    body: [
                        "## Commands",
                        "",
                        "```bash",
                        "nest new my-api",
                        "cd my-api",
                        "npm run start:dev",
                        "```",
                        "",
                        "- Default listen port is usually **3000**.",
                        "- Stop with `Ctrl+C` when done.",
                    ].join("\n"),
                    orderIndex: 0,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: buildChallengeId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            challengeIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "title",
                            value: "Khởi tạo ứng dụng NestJS",
                        },
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "description",
                            value:
                                "Tạo dự án NestJS mới bằng CLI (`nest new`) hoặc dùng starter của khóa học. Chạy server dev và xác nhận ứng dụng lắng nghe đúng cổng.",
                        },
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "body",
                            value: [
                                "## Lệnh",
                                "",
                                "```bash",
                                "nest new my-api",
                                "cd my-api",
                                "npm run start:dev",
                                "```",
                                "",
                                "- Cổng mặc định thường là **3000**.",
                                "- Dừng server bằng `Ctrl+C`.",
                            ].join("\n"),
                        },
                    ],
                },
                {
                    id: buildChallengeStepId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                        stepIndex: 1,
                    }),
                    title: "Expose GET /health",
                    description:
                        "Add a route handler that returns JSON such as `{ \"status\": \"ok\" }`. Test it with curl or your HTTP client.",
                    body: [
                        "## Response",
                        "",
                        "Return JSON like:",
                        "",
                        "```json",
                        "{ \"status\": \"ok\" }",
                        "```",
                        "",
                        "## Verify",
                        "",
                        "```bash",
                        "curl -s http://localhost:3000/health",
                        "```",
                    ].join("\n"),
                    orderIndex: 1,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: buildChallengeId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            challengeIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 1,
                            }),
                            locale: Locale.Vi,
                            field: "title",
                            value: "Thêm GET /health",
                        },
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 1,
                            }),
                            locale: Locale.Vi,
                            field: "description",
                            value:
                                "Thêm handler trả JSON ví dụ `{ \"status\": \"ok\" }`. Kiểm tra bằng curl hoặc HTTP client.",
                        },
                        {
                            challengeStepId: buildChallengeStepId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                stepIndex: 1,
                            }),
                            locale: Locale.Vi,
                            field: "body",
                            value: [
                                "## Phản hồi",
                                "",
                                "Trả JSON dạng:",
                                "",
                                "```json",
                                "{ \"status\": \"ok\" }",
                                "```",
                                "",
                                "## Kiểm tra",
                                "",
                                "```bash",
                                "curl -s http://localhost:3000/health",
                                "```",
                            ].join("\n"),
                        },
                    ],
                },
            ],
            references: [
                {
                    id: buildChallengeReferenceId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                        referenceIndex: 0,
                    }),
                    alias: "NestJS First steps",
                    url: "https://docs.nestjs.com/first-steps",
                    orderIndex: 0,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: buildChallengeId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            challengeIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            challengeReferenceId: buildChallengeReferenceId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                challengeIndex: 0,
                                referenceIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "alias",
                            value: "NestJS các bước đầu",
                        },
                    ],
                },
            ],
            translations: [
                {
                    challengeId: buildChallengeId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: "Khởi tạo HTTP API với NestJS",
                },
                {
                    challengeId: buildChallengeId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "brief",
                    value: [
                        "**Mục tiêu:** thêm controller tối thiểu có route health trả JSON.",
                        "",
                        "_Điều kiện:_ Node.js LTS và Nest CLI (`npm i -g @nestjs/cli`).",
                    ].join("\n"),
                },
                {
                    challengeId: buildChallengeId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        challengeIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value:
                        "Tạo ứng dụng NestJS với một controller GET /health trả về JSON nhỏ. Đảm bảo server khởi động không lỗi.",
                },
            ],
        },
    ],
    translations: [
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
            }),
            locale: Locale.En,
            field: "title",
            value: "Backend Environment & NestJS Introduction",
        },
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
            }),
            locale: Locale.En,
            field: "description",
            value: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
        },
    ],
    contents: [
        {
            id: buildContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                contentIndex: 0,
            }),
            minutesRead: 25,
            thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            title: readMetadataOrDefault(
                buildContentId({
                    courseId: CourseId.FullstackMastery,
                    moduleIndex: 0,
                    contentIndex: 0,
                }),
                Locale.En,
                "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs."
            ),
            description: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
            body: readFileOrDefault(
                `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/0/content/body.en.md`,
                ""
            ),
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: readMetadataOrDefault(
                        buildContentId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            contentIndex: 0,
                        }),
                        Locale.Vi,
                        "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs."
                    ),
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "body",
                    value: readFileOrDefault(
                        `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/0/content/body.vi.md`,
                        "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs."
                    ),
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        contentIndex: 0,
                    }),
                    locale: Locale.En,
                    field: "description",
                    value: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        contentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value: "Thiết lập môi trường Node.js, cài đặt NestJS, hiểu Dependency Injection, Module System, Request Lifecycle, Exception Handling, Logging, Validation và cách xây dựng các API cơ bản.",
                },
            ],
            references: [
                {
                    id: buildContentReferenceId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        contentIndex: 0,
                        referenceIndex: 0,
                    }),
                    alias: "NestJS documentation",
                    url: "https://docs.nestjs.com/",
                    orderIndex: 0,
                    defaultLocale: Locale.En,
                    content: {
                        id: buildContentId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 0,
                            contentIndex: 0,
                        }),
                    },
                    translations: [
                        {
                            contentReferenceId: buildContentReferenceId({
                                courseId: CourseId.FullstackMastery,
                                moduleIndex: 0,
                                contentIndex: 0,
                                referenceIndex: 0,
                            }),
                            locale: Locale.Vi,
                            field: "alias",
                            value: "Tài liệu NestJS",
                        },
                    ],
                },
            ],
        },
    ],
    previewContents: [
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 0,
            }),
            data: "Understand the backend ecosystem and how languages/frameworks like Java, C#, Node.js, Golang, and Python are used in real-world systems.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu tổng quan hệ sinh thái backend và vai trò của các ngôn ngữ/framework như Java, C#, Node.js, Golang và Python trong hệ thống thực tế.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 1,
            }),
            data: "Set up Node.js, install NestJS CLI, and structure a production-ready project from scratch.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Thiết lập môi trường Node.js, cài đặt NestJS CLI và xây dựng cấu trúc project chuẩn production ngay từ đầu.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 2,
            }),
            data: "Understand Dependency Injection and the Module System to build scalable and maintainable architectures.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 2,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Hiểu rõ Dependency Injection và Module System để xây dựng kiến trúc dễ mở rộng và dễ bảo trì.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 3,
            }),
            data: "Master the NestJS request lifecycle: Middleware → Guards → Pipes → Controllers → Services → Interceptors → Exception Filters.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 3,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Nắm vững request lifecycle trong NestJS: Middleware → Guards → Pipes → Controllers → Services → Interceptors → Exception Filters.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 4,
            }),
            data: "Apply clean architecture principles by separating transport layer from business logic.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 4,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Áp dụng nguyên lý Clean Architecture bằng cách tách biệt tầng xử lý request và business logic.",
                },
            ],
        },
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 0,
                previewContentIndex: 5,
            }),
            data: "Prepare for production with environment config, structured logging (Winston), and standardized API responses.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 0,
                        previewContentIndex: 5,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Chuẩn bị hệ thống cho production với cấu hình môi trường, logging có cấu trúc (Winston) và chuẩn hóa response API.",
                },
            ],
        },
    ],
}