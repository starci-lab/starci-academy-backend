const fs = require("fs")
const path = require("path")

const SEP = "<!-- @starci/seperator -->"

const MODULES = [
    "courses/0-fullstack-mastery/modules/7-routing-and-url-state-nextjs",
    "courses/0-fullstack-mastery/modules/12-server-components-suspense-streaming",
    "courses/0-fullstack-mastery/modules/13-frontend-performance",
    "courses/0-fullstack-mastery/modules/14-ui-polish-techniques",
    "courses/0-fullstack-mastery/modules/15-interaction-and-accessibility",
    "courses/0-fullstack-mastery/modules/16-observability-logs-tracing-errors",
    "courses/0-fullstack-mastery/modules/17-security-end-to-end",
    "courses/0-fullstack-mastery/modules/18-testing-strategy",
    "courses/0-fullstack-mastery/modules/19-deploy-and-devops-workflow",
    "courses/1-system-design-mastery/modules/8-security-and-identity-management",
    "courses/1-system-design-mastery/modules/20-webhook-delivery-system",
]

const MODULE_META = {
    "7-routing-and-url-state-nextjs": {
        enTitle: "Routing and URL State in Next.js",
        viTitle: "Routing và URL State trong Next.js",
        enDesc:
            "Master the Next.js App Router: dynamic routes, nested layouts, searchParams as state, parallel and intercepting routes, and middleware for auth and i18n.",
        viDesc:
            "Nắm App Router Next.js: dynamic route, nested layout, searchParams làm state, parallel/intercepting route và middleware cho auth và i18n.",
    },
    "12-server-components-suspense-streaming": {
        enTitle: "Server Components, Suspense and Streaming",
        viTitle: "Server Components, Suspense và Streaming",
        enDesc:
            "Learn React Server Components, Suspense boundaries, streaming HTML, Server Actions for forms, and Partial Prerendering (PPR) in Next.js 14+.",
        viDesc:
            "Học React Server Components, Suspense boundary, streaming HTML, Server Actions cho form và Partial Prerendering (PPR) trên Next.js 14+.",
    },
    "13-frontend-performance": {
        enTitle: "Frontend Performance",
        viTitle: "Hiệu năng Frontend",
        enDesc:
            "Optimize Core Web Vitals, bundle size, images, fonts, and runtime performance patterns for production Next.js apps.",
        viDesc:
            "Tối ưu Core Web Vitals, bundle size, image, font và pattern hiệu năng runtime cho app Next.js production.",
    },
    "14-ui-polish-techniques": {
        enTitle: "UI Polish Techniques",
        viTitle: "Kỹ thuật UI Polish",
        enDesc:
            "Apply design tokens, motion, skeletons, empty states, and visual hierarchy to ship polished product UI.",
        viDesc:
            "Áp design token, motion, skeleton, empty state và visual hierarchy để UI sản phẩm chỉn chu.",
    },
    "15-interaction-and-accessibility": {
        enTitle: "Interaction and Accessibility",
        viTitle: "Tương tác và Accessibility",
        enDesc:
            "Build keyboard-first flows, ARIA patterns, focus management, and accessible forms and dialogs.",
        viDesc:
            "Xây flow ưu tiên bàn phím, pattern ARIA, quản lý focus và form/dialog accessible.",
    },
    "16-observability-logs-tracing-errors": {
        enTitle: "Observability: Logs, Tracing and Errors",
        viTitle: "Observability: Log, Tracing và Lỗi",
        enDesc:
            "Instrument frontend and fullstack apps with structured logs, distributed tracing, and error reporting.",
        viDesc:
            "Gắn log có cấu trúc, distributed tracing và báo lỗi cho app frontend và fullstack.",
    },
    "17-security-end-to-end": {
        enTitle: "Security End to End",
        viTitle: "Bảo mật End to End",
        enDesc:
            "Harden auth, CSRF, XSS, secrets, headers, and secure API boundaries across the stack.",
        viDesc:
            "Củng cố auth, CSRF, XSS, secret, header và ranh giới API an toàn trên toàn stack.",
    },
    "18-testing-strategy": {
        enTitle: "Testing Strategy",
        viTitle: "Chiến lược Testing",
        enDesc:
            "Design a testing pyramid with unit, integration, and E2E tests for Next.js and NestJS codebases.",
        viDesc:
            "Thiết kế testing pyramid với unit, integration và E2E cho codebase Next.js và NestJS.",
    },
    "19-deploy-and-devops-workflow": {
        enTitle: "Deploy and DevOps Workflow",
        viTitle: "Deploy và DevOps Workflow",
        enDesc:
            "Ship CI/CD pipelines, environments, Docker images, and release workflows for academy projects.",
        viDesc:
            "Triển khai CI/CD, môi trường, Docker image và quy trình release cho dự án academy.",
    },
    "8-security-and-identity-management": {
        enTitle: "Security and Identity Management",
        viTitle: "Bảo mật và Quản lý Identity",
        enDesc:
            "Integrate secret managers and Keycloak for identity, JWT flows, and protected APIs in distributed systems.",
        viDesc:
            "Tích hợp secret manager và Keycloak cho identity, flow JWT và API được bảo vệ trong hệ phân tán.",
    },
    "20-webhook-delivery-system": {
        enTitle: "Webhook Delivery System",
        viTitle: "Hệ thống Webhook Delivery",
        enDesc:
            "Design webhook signing, retries, outbox idempotent delivery, dead-letter queues, and circuit breakers.",
        viDesc:
            "Thiết kế ký webhook, retry, outbox giao hàng idempotent, dead-letter queue và circuit breaker.",
    },
}

const extractField = (md, field) => {
    const escapedSep = SEP.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const re = new RegExp(
        `# ${field}\\s*\\n${escapedSep}\\s*\\n([\\s\\S]*?)(?=\\n${escapedSep}|\\n# |$)`,
        "u",
    )
    const m = md.match(re)
    return m ? m[1].trim() : ""
}

const readContentLocale = (contentDir, locale) => {
    const file = path.join(contentDir, `${locale}.md`)
    if (!fs.existsSync(file)) {
        return null
    }
    return fs.readFileSync(file, "utf8")
}

const buildPreviewFromContents = (moduleDir, locale) => {
    const contentsDir = path.join(moduleDir, "contents")
    if (!fs.existsSync(contentsDir)) {
        return []
    }
    const dirs = fs
        .readdirSync(contentsDir)
        .filter((name) => {
            const p = path.join(contentsDir, name)
            return fs.statSync(p).isDirectory() && /^\d+-/.test(name)
        })
        .sort((a, b) => {
            const ai = parseInt(a.split("-")[0], 10)
            const bi = parseInt(b.split("-")[0], 10)
            return ai - bi
        })

    return dirs.map((dirName, orderIndex) => {
        const contentDir = path.join(contentsDir, dirName)
        const md = readContentLocale(contentDir, locale)
        let text = ""
        if (md) {
            text = extractField(md, "title")
        }
        if (!text) {
            text = dirName
                .replace(/^\d+-/, "")
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
        }
        return {
            orderIndex,
            text,
        }
    })
}

const buildModuleMd = (meta, previews, locale) => {
    const title = locale === "en" ? meta.enTitle : meta.viTitle
    const description = locale === "en" ? meta.enDesc : meta.viDesc
    const lines = [
        "# title",
        SEP,
        title,
        SEP,
        "# description",
        SEP,
        description,
        SEP,
        "# previewContents",
    ]
    for (const preview of previews) {
        lines.push("## " + preview.orderIndex)
        lines.push("### text")
        lines.push(SEP)
        lines.push(preview.text)
        lines.push(SEP)
    }
    return lines.join("\n") + "\n"
}

const root = path.join(process.cwd(), ".mount", "data")

for (const rel of MODULES) {
    const moduleDir = path.join(root, ...rel.split("/"))
    const slug = path.basename(moduleDir)
    const meta = MODULE_META[slug]
    if (!meta) {
        console.error("No meta for", slug)
        continue
    }

    const enPreviews = buildPreviewFromContents(moduleDir, "en")
    const viPreviews = buildPreviewFromContents(moduleDir, "vi")

    const enPath = path.join(moduleDir, "en.md")
    const viPath = path.join(moduleDir, "vi.md")

    fs.writeFileSync(enPath, buildModuleMd(meta, enPreviews, "en"), "utf8")
    fs.writeFileSync(viPath, buildModuleMd(meta, viPreviews, "vi"), "utf8")
    console.log("Wrote", enPath)
    console.log("Wrote", viPath)
}
