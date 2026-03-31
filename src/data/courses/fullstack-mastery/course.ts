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

/**
 * Course row only (no `modules`; composed with module seeds in `fullstack-mastery/index.ts`).
 */
export const fullstackMasteryCourseBase: DeepPartial<CourseEntity> = {
    id: "fullstack-mastery",
    title: "Fullstack Mastery",
    slug: null,
    cdnUrl: null,
    description:
        "Build strong fundamentals, practical skills, and an engineering mindset to land your first internship or Fresher/Junior Developer role. Learn fullstack development from frontend to backend with real-world focus.",
    translations: [
        {
            courseId: "fullstack-mastery",
            locale: Locale.Vi,
            field: "title",
            value: "Fullstack Mastery",
        },
        {
            courseId: "fullstack-mastery",
            locale: Locale.En,
            field: "description",
            value:
                "Build strong fundamentals, practical skills, and an engineering mindset to land your first internship or Fresher/Junior Developer role. Learn fullstack development from frontend to backend with real-world focus.",
        },
    ],
    originalPrice: 1500000,
    currentPhase: PricingPhase.Pioneer,
    pricingPhases: [
        {
            id: "fullstack-mastery-pricing-pioneer",
            phase: PricingPhase.Pioneer,
            price: 990000,
            slotAvailable: 30,
            orderIndex: 0,
        },
        {
            id: "fullstack-mastery-pricing-earlybird",
            phase: PricingPhase.EarlyBird,
            price: 1190000,
            slotAvailable: 50,
            orderIndex: 1,
        },
        {
            id: "fullstack-mastery-pricing-regular",
            phase: PricingPhase.Regular,
            price: undefined,
            slotAvailable: undefined,
            orderIndex: 2,
        },
    ],
    valuePropositions: [
        {
            id: "fullstack-mastery-vp-1",
            content: "Modular curriculum from foundations to hands-on delivery.",
            orderIndex: 0,
            translations: [
                {
                    valuePropositionId: "fullstack-mastery-vp-1",
                    locale: Locale.En,
                    field: "content",
                    value: "Modular curriculum from foundations to hands-on delivery.",
                },
            ],
        },
        {
            id: "fullstack-mastery-vp-2",
            content: "High-quality lessons with direct explanations—no fluff.",
            orderIndex: 1,
            translations: [
                {
                    valuePropositionId: "fullstack-mastery-vp-2",
                    locale: Locale.En,
                    field: "content",
                    value: "High-quality lessons with direct explanations—no fluff.",
                },
            ],
        },
        {
            id: "fullstack-mastery-vp-3",
            content: "Hands-on exercises to sharpen engineering mindset and skills.",
            orderIndex: 2,
            translations: [
                {
                    valuePropositionId: "fullstack-mastery-vp-3",
                    locale: Locale.En,
                    field: "content",
                    value: "Hands-on exercises to sharpen engineering mindset and skills.",
                },
            ],
        },
        {
            id: "fullstack-mastery-vp-4",
            content: "1:1 CV review and help distributing your CV to hiring networks.",
            orderIndex: 3,
            translations: [
                {
                    valuePropositionId: "fullstack-mastery-vp-4",
                    locale: Locale.En,
                    field: "content",
                    value: "1:1 CV review and help distributing your CV to hiring networks.",
                },
            ],
        },
    ],
    prerequisites: [
        {
            id: "fullstack-mastery-prerequisite-1",
            content: "JavaScript/TypeScript Basics: variables, functions, async/await.",
            orderIndex: 0,
            translations: [
                {
                    prerequisiteId: "fullstack-mastery-prerequisite-1",
                    locale: Locale.En,
                    field: "content",
                    value: "JavaScript/TypeScript Basics: variables, functions, async/await.",
                },
            ],
        },
        {
            id: "fullstack-mastery-prerequisite-2",
            content:
                "Build fullstack fundamentals and practical skills to land your first developer role. Backend Basics: API, request/response, simple CRUD.",
            orderIndex: 1,
            translations: [
                {
                    prerequisiteId: "fullstack-mastery-prerequisite-2",
                    locale: Locale.En,
                    field: "content",
                    value:
                        "Build fullstack fundamentals and practical skills to land your first developer role. Backend Basics: API, request/response, simple CRUD.",
                },
            ],
        },
    ],
    qnas: [
        {
            id: "fullstack-mastery-qna-1",
            question: "I'm using Java, .NET, or Python — can I still take this course?",
            answer:
                "Absolutely. This course uses NestJS as the teaching framework because it is modern and helps explain backend concepts clearly. However, backend development is not about a specific language or framework — it’s about system thinking and problem-solving. The mentor has a strong multi-stack background, so you’ll be guided on how to map these concepts to Java, .NET, or Python when needed.",
            orderIndex: 0,
            translations: [
                {
                    qnaId: "fullstack-mastery-qna-1",
                    locale: Locale.En,
                    field: "question",
                    value: "I'm using Java, .NET, or Python — can I still take this course?",
                },
                {
                    qnaId: "fullstack-mastery-qna-1",
                    locale: Locale.En,
                    field: "answer",
                    value:
                        "Absolutely. This course uses NestJS as the teaching framework because it is modern and helps explain backend concepts clearly. However, backend development is not about a specific language or framework — it’s about system thinking and problem-solving. The mentor has a strong multi-stack background, so you’ll be guided on how to map these concepts to Java, .NET, or Python when needed.",
                },
            ],
        },
        {
            id: "fullstack-mastery-qna-2",
            question: "There are many backend courses out there — should I take this one?",
            answer:
                "If you're looking for a course that only covers basic CRUD and surface-level knowledge, this is not for you. This course goes straight to the core of backend engineering — from system design thinking to solving real-world problems and handling production-level challenges. The curriculum is designed to be fast, direct, and practical, helping you truly understand and apply what you learn, rather than just knowing it superficially.",
            orderIndex: 1,
            translations: [
                {
                    qnaId: "fullstack-mastery-qna-2",
                    locale: Locale.En,
                    field: "question",
                    value: "There are many backend courses out there — should I take this one?",
                },
                {
                    qnaId: "fullstack-mastery-qna-2",
                    locale: Locale.En,
                    field: "answer",
                    value:
                        "If you're looking for a course that only covers basic CRUD and surface-level knowledge, this is not for you. This course goes straight to the core of backend engineering — from system design thinking to solving real-world problems and handling production-level challenges. The curriculum is designed to be fast, direct, and practical, helping you truly understand and apply what you learn, rather than just knowing it superficially.",
                },
            ],
        },
    ],
}
