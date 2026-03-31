import type {
    DeepPartial,
} from "typeorm"
import type {
    CourseEntity,
} from "@modules/databases"
import {
    Locale,
    PricingPhase,
} from "@modules/databases"
import {
    fullstackMasteryModules,
} from "./modules"
import {
    CourseId,
    buildPricingPhaseId,
    buildValuePropositionId,
    buildPrerequisiteId,
    buildQnaId,
} from "../../utils"

/**
 * Fullstack Mastery course data.
 */
export const fullstackMasteryCourse: DeepPartial<CourseEntity> = {
    id: CourseId.FullstackMastery,
    title: "Fullstack Mastery",
    slug: "fullstack-mastery",
    description:
        "Build strong fundamentals, practical skills, and an engineering mindset to land your first internship or Fresher/Junior Developer role. Learn fullstack development from frontend to backend with real-world focus.",
    translations: [
        {
            courseId: CourseId.FullstackMastery,
            locale: Locale.Vi,
            field: "title",
            value: "Fullstack Mastery",
        },
        {
            courseId: CourseId.FullstackMastery,
            locale: Locale.Vi,
            field: "description",
            value:
                "Xây dựng nền tảng vững chắc, kỹ năng thực chiến và tư duy engineering để đạt được công việc thực tập hoặc Fresher/Junior Developer. Học fullstack từ frontend đến backend với trọng tâm thực tế.",
        },
    ],

    originalPrice: 1500000,
    currentPhase: PricingPhase.Pioneer,

    pricingPhases: [
        {
            id: buildPricingPhaseId({
                courseId: CourseId.FullstackMastery,
                phaseIndex: 0,
            }),
            phase: PricingPhase.Pioneer,
            price: 990000,
            slotAvailable: 30,
            orderIndex: 0,
        },
        {
            id: buildPricingPhaseId({
                courseId: CourseId.FullstackMastery,
                phaseIndex: 1,
            }),
            phase: PricingPhase.EarlyBird,
            price: 1190000,
            slotAvailable: 50,
            orderIndex: 1,
        },
        {
            id: buildPricingPhaseId({
                courseId: CourseId.FullstackMastery,
                phaseIndex: 2,
            }),
            phase: PricingPhase.Regular,
            price: undefined,
            slotAvailable: undefined,
            orderIndex: 2,
        },
    ],

    valuePropositions: [
        {
            id: buildValuePropositionId({
                courseId: CourseId.FullstackMastery,
                valuePropositionIndex: 0,
            }),
            content: "Modular curriculum from foundations to hands-on delivery.",
            orderIndex: 0,
            translations: [
                {
                    valuePropositionId: buildValuePropositionId({
                        courseId: CourseId.FullstackMastery,
                        valuePropositionIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value: "Lộ trình học dạng module từ nền tảng đến triển khai thực tế.",
                },
            ],
        },
        {
            id: buildValuePropositionId({
                courseId: CourseId.FullstackMastery,
                valuePropositionIndex: 1,
            }),
            content: "High-quality lessons with direct explanations—no fluff.",
            orderIndex: 1,
            translations: [
                {
                    valuePropositionId: buildValuePropositionId({
                        courseId: CourseId.FullstackMastery,
                        valuePropositionIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value: "Bài giảng chất lượng cao, giải thích trực tiếp, không lan man.",
                },
            ],
        },
        {
            id: buildValuePropositionId({
                courseId: CourseId.FullstackMastery,
                valuePropositionIndex: 2,
            }),
            content: "Hands-on exercises to sharpen engineering mindset and skills.",
            orderIndex: 2,
            translations: [
                {
                    valuePropositionId: buildValuePropositionId({
                        courseId: CourseId.FullstackMastery,
                        valuePropositionIndex: 2,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value: "Bài tập thực hành giúp nâng cao tư duy và kỹ năng engineering.",
                },
            ],
        },
        {
            id: buildValuePropositionId({
                courseId: CourseId.FullstackMastery,
                valuePropositionIndex: 3,
            }),
            content: "1:1 CV review and help distributing your CV to hiring networks.",
            orderIndex: 3,
            translations: [
                {
                    valuePropositionId: buildValuePropositionId({
                        courseId: CourseId.FullstackMastery,
                        valuePropositionIndex: 3,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value: "Review CV 1:1 và hỗ trợ phân phối CV đến network tuyển dụng.",
                },
            ],
        },
    ],

    prerequisites: [
        {
            id: buildPrerequisiteId({
                courseId: CourseId.FullstackMastery,
                prerequisiteIndex: 0,
            }),
            content: "JavaScript/TypeScript Basics: variables, functions, async/await.",
            orderIndex: 0,
            translations: [
                {
                    prerequisiteId: buildPrerequisiteId({
                        courseId: CourseId.FullstackMastery,
                        prerequisiteIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value: "Kiến thức cơ bản JavaScript/TypeScript: biến, hàm, async/await.",
                },
            ],
        },
        {
            id: buildPrerequisiteId({
                courseId: CourseId.FullstackMastery,
                prerequisiteIndex: 1,
            }),
            content:
                "Backend basics: API, request/response, and simple CRUD features.",
            orderIndex: 1,
            translations: [
                {
                    prerequisiteId: buildPrerequisiteId({
                        courseId: CourseId.FullstackMastery,
                        prerequisiteIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "content",
                    value:
                        "Kiến thức backend cơ bản: API, request/response và các chức năng CRUD đơn giản.",
                },
            ],
        },
    ],
    qnas: [
        {
            id: buildQnaId({
                courseId: CourseId.FullstackMastery,
                qnaIndex: 0,
            }),
            question: "I'm using Java, .NET, or Python — can I still take this course?",
            answer:
                "Absolutely. This course uses NestJS to teach core backend concepts clearly. However, backend engineering is about system thinking, not a specific language. You will be guided on how to apply these concepts across different stacks.",
            orderIndex: 0,
            translations: [
                {
                    qnaId: buildQnaId({
                        courseId: CourseId.FullstackMastery,
                        qnaIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "question",
                    value: "Mình dùng Java, .NET hoặc Python thì có học được không?",
                },
                {
                    qnaId: buildQnaId({
                        courseId: CourseId.FullstackMastery,
                        qnaIndex: 0,
                    }),
                    locale: Locale.Vi,
                    field: "answer",
                    value:
                        "Hoàn toàn được. Khoá học sử dụng NestJS để giải thích rõ các concept backend, nhưng bản chất backend là tư duy hệ thống, không phải framework. Bạn sẽ được hướng dẫn cách áp dụng sang các stack khác.",
                },
            ],
        },
        {
            id: buildQnaId({
                courseId: CourseId.FullstackMastery,
                qnaIndex: 1,
            }),
            question: "There are many backend courses — why this one?",
            answer:
                "This is not a basic CRUD course. It focuses on real backend engineering: system thinking, real-world problem solving, and production-level challenges. The goal is to help you truly understand and apply knowledge.",
            orderIndex: 1,
            translations: [
                {
                    qnaId: buildQnaId({
                        courseId: CourseId.FullstackMastery,
                        qnaIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "question",
                    value: "Có rất nhiều khoá backend — tại sao nên chọn khoá này?",
                },
                {
                    qnaId: buildQnaId({
                        courseId: CourseId.FullstackMastery,
                        qnaIndex: 1,
                    }),
                    locale: Locale.Vi,
                    field: "answer",
                    value:
                        "Đây không phải khoá CRUD cơ bản. Khoá học tập trung vào backend thực tế: tư duy hệ thống, giải quyết vấn đề và xử lý bài toán production. Mục tiêu là giúp bạn hiểu sâu và áp dụng được.",
                },
            ],
        },
    ],
    modules: fullstackMasteryModules,
}