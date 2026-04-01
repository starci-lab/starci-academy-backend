import type {
    DeepPartial,
} from "typeorm"
import type {
    ModuleEntity,
} from "../../../../../entities"
import {
    Locale,
} from "../../../../../enums"
import {
    envConfig 
} from "@modules/env"
import {
    readFileOrDefault, 
    readMetadataOrDefault,
    buildContentId,
    buildPreviewContentId,
    CourseId,
    buildModuleId,
    buildLessonVideoId
} from "../../../../utils"

/**
 * Fullstack Mastery Module 1 data.
 */
export const fullstackMasteryModule1: DeepPartial<ModuleEntity> = {
    id: buildModuleId({
        courseId: CourseId.FullstackMastery,
        moduleIndex: 1,
    }),
    defaultLocale: Locale.En,
    title: "Backend Environment & NestJS Introduction",
    description:
        "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
    orderIndex: 0,
    lessonVideos: [
        {
            id: buildLessonVideoId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
            }),
            title: "Backend Environment & NestJS Introduction",
            description: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            durationMs: 5400000,
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: "Môi trường Backend & Giới thiệu NestJS",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "description",
                    value: "Thiết lập môi trường Node.js, cài đặt NestJS, hiểu Dependency Injection, Module System, Request Lifecycle, Exception Handling, Logging, Validation và cách xây dựng các API cơ bản.",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                    }),
                    locale: Locale.En,
                    field: "title",
                    value: "Backend Environment & NestJS Introduction",
                },
                {
                    lessonVideoId: buildLessonVideoId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                    }),
                    locale: Locale.En,
                    field: "description",
                    value: "Set up the Node.js environment, install NestJS, understand Dependency Injection, the Module System, the Request Lifecycle, Exception Handling, Logging, Validation, and how to build basic APIs.",
                },
            ],
        },
    ],
    translations: [
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
            }),
            locale: Locale.En,
            field: "title",
            value: "Backend Environment & NestJS Introduction",
        },
        {
            moduleId: buildModuleId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
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
                moduleIndex: 1,
                contentIndex: 1,
            }),
            title: readMetadataOrDefault(
                buildContentId({
                    courseId: CourseId.FullstackMastery,
                    moduleIndex: 1,
                    contentIndex: 1,
                }),
                Locale.En,
                ""
            ),
            body: readFileOrDefault(
                `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/1/content/body.en.md`, 
                ""
            ),
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "title",
                    value: readMetadataOrDefault(
                        buildContentId({
                            courseId: CourseId.FullstackMastery,
                            moduleIndex: 1,
                            contentIndex: 1,
                        }),
                        Locale.Vi,
                        ""
                    ),
                },
                {
                    contentId: buildContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        contentIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "body",
                    value: readFileOrDefault(
                        `${envConfig().mountPath.data.courses}/fullstack-mastery/modules/1/content/body.vi.md`, 
                        ""
                    ),
                },
            ],
        },
    ],
    previewContents: [
        {
            id: buildPreviewContentId({
                courseId: CourseId.FullstackMastery,
                moduleIndex: 1,
                previewContentIndex: 1,
            }),
            data: "Understand the backend ecosystem and how languages/frameworks like Java, C#, Node.js, Golang, and Python are used in real-world systems.",
            orderIndex: 0,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 1,
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
                moduleIndex: 1,
                previewContentIndex: 2,
            }),
            data: "Set up Node.js, install NestJS CLI, and structure a production-ready project from scratch.",
            orderIndex: 1,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 2,
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
                moduleIndex: 1,
                previewContentIndex: 3,
            }),
            data: "Understand Dependency Injection and the Module System to build scalable and maintainable architectures.",
            orderIndex: 2,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 3,
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
                moduleIndex: 1,
                previewContentIndex: 4,
            }),
            data: "Master the NestJS request lifecycle: Middleware → Guards → Pipes → Controllers → Services → Interceptors → Exception Filters.",
            orderIndex: 3,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 4,
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
                moduleIndex: 1,
                previewContentIndex: 5,
            }),
            data: "Apply clean architecture principles by separating transport layer from business logic.",
            orderIndex: 4,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 5,
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
                moduleIndex: 1,
                previewContentIndex: 6,
            }),
            data: "Prepare for production with environment config, structured logging (Winston), and standardized API responses.",
            orderIndex: 5,
            defaultLocale: Locale.En,
            translations: [
                {
                    previewContentId: buildPreviewContentId({
                        courseId: CourseId.FullstackMastery,
                        moduleIndex: 1,
                        previewContentIndex: 6,
                    }),
                    locale: Locale.Vi,
                    field: "data",
                    value: "Chuẩn bị hệ thống cho production với cấu hình môi trường, logging có cấu trúc (Winston) và chuẩn hóa response API.",
                },
            ],
        },
    ],
}
