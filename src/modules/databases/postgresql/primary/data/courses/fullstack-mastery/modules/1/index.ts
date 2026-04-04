import type {
    ModuleEntity,
} from "../../../../../entities"
import {
    Locale,
} from "../../../../../enums"
import {
    DeepPartial
} from "typeorm"
import {
    buildModuleId,
    CourseId,
    buildLessonVideoId,
    buildPreviewContentId,
} from "../../../../utils"
import {
    parseChallenge,
    parseContent,
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
        parseChallenge(
            {
                index: 0,
                moduleIndex: 0,
                courseId: CourseId.FullstackMastery,
            }
        ),
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
        parseContent(
            {
                index: 0,
                moduleIndex: 0,
                courseId: CourseId.FullstackMastery,
            },
        ),
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