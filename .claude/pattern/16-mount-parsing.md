# 16 — Mount markdown parsing

Quy tắc viết code khi parse file mount (`.mount/data/courses/**/*.md`) thành entity. Rút ra từ phiên fix `challenge.service.ts` + `merge.service.ts` (2026-05-30).

## TL;DR

- **Parse 1 lần qua `ExtractJsonFromMdService` + `MergeJsonService`.** KHÔNG re-extract string leaf bằng tay.
- **`parse(params)` cho 1 item + `parseMany(params)` chỉ loop gọi `parse`.** Mọi parser theo khuôn `course.service.ts` / `content.service.ts`.
- **Dùng `merged.X` render thẳng vào entity.** KHÔNG `Array.from(jsonMap.entries()).map(...)` thủ công cho i18n.
- **Lá nested kiểu folder con (`bodies/`, `submissions/`) → tách hàm `parseBodies()` / `parseSubmissions()`** scan folder rồi merge per-locale.

---

## 1. Hai khuôn parser

Mỗi parser service có đúng 2 hàm public:

```ts
async parse(params: ParseXParams): Promise<DeepPartial<XEntity>> {
    // 1. find path / throw NotFoundException
    // 2. extract per-locale → jsonMap
    // 3. merge via mergeJsonService → merged
    // 4. return entity graph render thẳng từ merged
}

async parseMany(params: ParseXManyParams): Promise<Array<ResolvedFileResult<DeepPartial<XEntity>>>> {
    const paths = await this.xPathService.paths(...)
    for (const path of paths) {
        try {
            data.push({
                data: await this.parse({...params, xIndex: path.orderIndex}),
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        } catch (error) {
            logInitSeederEntitySkipped(...)  // skip + log, không throw
        }
    }
    return data
}
```

Mẫu chuẩn: `course.service.ts`, `content.service.ts`, `challenge.service.ts`.

---

## 2. Render thẳng từ `merged` — KHÔNG duyệt jsonMap thủ công

```ts
// ❌ HOANG DÃ — không dùng được nested array, code dài lê thê
const translations = Array.from(jsonMap.entries()).map(([locale, doc]) =>
    (doc.requirements ?? [])
        .filter((requirement) => requirement.orderIndex === orderIndex)
        .map((requirement) => [
            { challengeRequirementId, locale, field: "purpose", value: requirement.purpose },
            ...
        ])
).flat().flat()

// ✅ KHUÔN CHUẨN — merge đã align orderIndex sẵn, chỉ map
requirements: (merged.requirements ?? []).map(({ orderIndex, purpose, translations }) => ({
    id: this.requirementIdFactory.generate({...}),
    purpose,
    translations: (translations ?? []).map(({ locale, field, value }) => ({
        challengeRequirementId,
        locale,
        field,
        value,
    })),
}))
```

`MergeJsonService` đã gắn `translations[]` lên từng item theo đúng `translateFields` config. Việc của parser là **map**, không phải align.

### Dot-path `translateFields` syntax

- `"title"` — root scalar
- `"prerequisites.text"` — 1 cấp array, leaf trên item
- `"requirements.data.title"` — 2 cấp array (nested), merge tự align cả 2 cấp theo `orderIndex`

Không cần syntax `[]` (`requirements[].data[].title`) — runtime detect array từ canonical tree.

---

## 3. English MUST đứng đầu trong `jsons` input

```ts
// ❌ Object.values(Locale) thường trả ["vi", "en"] → translations[0] = vi
const merged = this.mergeJsonService.merge({
    jsons: Object.values(Locale).map((locale) => ({...})),
})

// ✅ ép En lên đầu
const orderedLocales = [Locale.En, ...Object.values(Locale).filter((l) => l !== Locale.En)]
const merged = this.mergeJsonService.merge({
    jsons: orderedLocales.map((locale) => ({...})),
})
```

Vì En là canonical, spec assert `translations[0]` luôn là En → ép thứ tự ngay đầu vào.

---

## 4. KHÔNG re-extract string leaf bằng tay

Nếu phải gọi `extractJsonFromMdService.extract()` **lần thứ 2** trên một field string đã extract → **mount file sai format**, không phải code sai.

Triệu chứng: field expect là object/array nhưng `merged.X` ra string opaque.

```ts
// ❌ HOANG DÃ — fix triệu chứng bằng cách re-extract
if (typeof merged.outcomeCriterias === "string") {
    const re = this.extractJsonFromMdService.extract<...>(merged.outcomeCriterias)
    const items = Array.isArray(re.data) ? re.data : []
    // ... map items + chế field __score rồi stripScore() ...
}

// ✅ Sửa mount: bỏ wrap `<!-- @starci/seperator -->` ngoài cùng quanh section,
//    bump heading depth để parser đệ quy đi xuống đúng level.
//    Code parser chỉ cần .map đơn giản:
const items = Array.isArray(merged.outcomeCriterias) ? merged.outcomeCriterias : []
return items.map((criterion) => ({...}))
```

**Root cause khi extract trả string leaf:**
1. Section bọc `<!-- @starci/seperator -->` ngay sau heading → trở thành string leaf nguyên văn
2. Heading children cùng level với section parent (vd `# outcomeCriterias` + `# 0` đều h1) → parser đệ quy xuống level 2, bỏ qua h1

→ Fix mount, không vá code. Xem rule `v2-audit-rules.md §9.6 + §9.7`.

---

## 5. Lá nested kiểu folder → tách `parseX()` private method

Khi mount có folder con (`bodies/<N>-<lang>/`, `submissions/<N>/`) → tách 1 method scan folder + load locale rồi merge:

```ts
private async parseBodies({ contentRelativePath, ... }): Promise<Array<DeepPartial<ContentBodyEntity>>> {
    const paths = await this.pathResolverService.filePaths("courses", `${contentRelativePath}/bodies`)
    const bodies = []
    for (const path of paths) {
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            try {
                jsonMap.set(locale, this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load("courses", `${path.relativePath}/${locale}.md`),
                ))
            } catch {
                jsonMap.set(locale, {})  // locale file optional
            }
        }
        const merged = this.mergeJsonService.merge({ jsons: [...], translateFields: ["body"] })
        bodies.push({
            id: this.xIdFactory.generate({..., orderIndex: path.orderIndex}),
            ...,
            translations: (merged.translations ?? []).filter(({field}) => field === "body").map(...),
        })
    }
    return bodies
}
```

Mẫu: `content.service.ts → parseBodies()`, `challenge.service.ts → parseSubmissions()`.

---

## 6. Anti-patterns

| ❌ Đừng làm | ✅ Thay bằng |
|---|---|
| `Array.from(jsonMap.entries()).flatMap(...)` để build translations | Khai `translateFields` đúng dot-path → `merged.X.translations` |
| `extractJsonFromMdService.extract(merged.someField)` (2nd extract) | Sửa mount: bỏ wrap separator + bump heading depth |
| Field synthetic `__score` rồi `stripScore()` | Return `{rows, totalScore}` từ helper |
| `as unknown as DeepPartial<Y>` ở mọi assignment | Tạo type alias hẹp, cast 1 lần ở boundary |
| `fs.writeFileSync("merged.json", ...)` debug code lọt vào commit | Dùng test spec inspect output |
| Parse `forEach` + push state thay vì `.map().filter()` | Functional, dễ trace |
| `parseMany` inline toàn bộ logic, không có `parse` | Tách `parse(1 item)` + `parseMany` loop |

---

## 7. Test pattern

- Spec đặt cạnh service: `challenge.service.spec.ts`
- Đăng ký id-factories thật (Sha256Service + factory chain) — không mock
- Mock `ContextLoaderService.load` đọc file thật từ `.mount`
- Mock `XPathService` (path discovery)
- Mock `PathResolverService.filePaths` dùng helper `listIndexedMountDirs` (đọc disk)
- Assert: length của array, scalar fields, **translations entries** (chứa `{locale, field, value}` per i18n field)

Mẫu: `merge.service.spec.ts` (9 case từ unit → integration với en.json/vi.json fixture), `challenge.service.spec.ts` (parse 2 challenges thật từ mount).
