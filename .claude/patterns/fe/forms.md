# Form idioms — STRICT

Phạm vi: cách VIẾT form trong app (thư viện, validation, submit, hiển thị lỗi) — ground 100% từ `src/hooks/rhf/**` + consumer thật trong `src/components/**`. Đây là code-style, KHÔNG phải design.

## 1. Stack cố định: react-hook-form + zod + zodResolver

- Mọi form = `useForm` (react-hook-form) + `zodResolver` (`@hookform/resolvers/zod`) + schema `zod`. KHÔNG formik (đã bỏ), KHÔNG tự quản state bằng `useState` cho từng field.
- ✅ `src/hooks/rhf/usePinExternalProjectForm.ts`:
```ts
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
const form = useForm<PinExternalProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", url: "", techStack: "" },
})
```
- ❌ `const [name, setName] = useState("")` rồi validate tay — không có file form nào làm vậy.

## 2. Logic form sống trong `src/hooks/rhf/`, KHÔNG trong component

- Mỗi form = 1 hook `use<Tên>Form.ts` trong `src/hooks/rhf/`, `"use client"`, export: `FormValues` (interface/`z.infer`), schema (khi cần), và hook trả về `{ ...form, onSubmit, … }`. Component chỉ BIND field.
- ✅ `src/hooks/rhf/useContactForm.ts`: `return { ...form, onSubmit, sent, onSendAnother }` — spread toàn bộ RHF methods + `onSubmit` đã bọc sẵn.
- ✅ Consumer `src/components/features/contact/Contact/ContactForm/index.tsx`: chỉ `const { watch, setValue, onSubmit, formState } = useContactForm()`.
- ❌ Gọi `useForm(...)` trực tiếp trong component feature/modal — đưa xuống hook `rhf/`.

## 3. Schema: i18n message → `useMemo`; static → module const. Max-length = hằng module-level

- Message phụ thuộc `t()` → `schema` trong `useMemo(() => z.object({...}), [t])`. Không có i18n → `useMemo(… , [])` hoặc const ngoài hook.
- Giới hạn độ dài = hằng `SCREAMING_SNAKE` cạnh field, mirror cột DB.
- ✅ `src/hooks/rhf/useContactForm.ts`:
```ts
const NAME_MAX = 100
const schema = useMemo(() => z.object({
    name: z.string().trim().min(1, t("contact.form.nameRequired")).max(NAME_MAX),
    email: z.string().trim().email(t("contact.form.emailInvalid")).max(EMAIL_MAX),
}), [t])
```
- Field optional-hoặc-URL = union với chuỗi rỗng, KHÔNG `.optional()`: `z.union([z.literal(""), z.string().trim().url().max(URL_MAX)])` (`useEditProfileForm.ts`, `useSubmitJobPostingForm.ts`).
- Enum-hoặc-chưa-chọn = `z.union([z.nativeEnum(WorkMode), z.literal("")])`.

## 4. `onSubmit` bọc `handleSubmit` NGAY trong hook; component chỉ `<form onSubmit={onSubmit}>`

- Hook trả về `onSubmit = form.handleSubmit(async (value) => …)`. Component KHÔNG tự gọi `handleSubmit`.
- ✅ `src/hooks/rhf/usePersonalProjectIdeaForm.ts`: `const onSubmit = form.handleSubmit(async (value) => {…}); return { ...form, onSubmit }`.
- ✅ `src/components/.../ContactForm/index.tsx`: `<form onSubmit={onSubmit} className={cn("flex flex-col gap-3", className)}>`.
- ❌ `<form onSubmit={handleSubmit(doThing)}>` trong component — việc đó thuộc hook.

## 5. Gọi API qua `useGraphQLWithToast`; lỗi nghiệp vụ = `throw new Error(t(...))` trong callback

- Trong `handleSubmit`, gọi mutation SWR bên trong `runGraphQL(async () => {…}, { showErrorToast, showSuccessToast })`. Cross-field / envelope lỗi → `throw new Error(...)` (toast tự bắt), KHÔNG `setError` field-level.
- ✅ `src/hooks/rhf/useSubmitJobPostingForm.ts`:
```ts
const onSubmit = form.handleSubmit(async (value) => runGraphQL(async () => {
    if (!companyId && !newCompanyTitle) throw new Error(t("jobs.post.errors.companyRequired"))
    const result = await submitJobPostingSwr.trigger({ … })
    const env = result?.data?.submitJobPosting
    if (!env) throw new Error(t("toast.defaultError"))
    if (env.success && env.data) onSuccess?.(env.data)
    return env
}, { showErrorToast: true, showSuccessToast: false }))
```
- Lưu ý: đây là idiom FE (throw `Error` thô trong callback toast). Rule "luôn AbstractException" chỉ áp cho BE.

## 6. Re-seed từ store = option `values`, KHÔNG `defaultValues` + `reset` tay

- Form mới trắng → `defaultValues`. Form seed từ redux/props (edit) → `values:` (thay `enableReinitialize` của formik cũ).
- ✅ `src/hooks/rhf/useEditProfileForm.ts`: `values: { displayName: user?.displayName ?? "", … }` — tự re-seed khi redux user đổi.
- ✅ `src/hooks/rhf/usePersonalProjectIdeaForm.ts`: `values: { ideaText: enrollment?.ideaText ?? "" }`.

## 7. Bind field — 3 idiom repo đang dùng, chọn theo loại control

- **`register("name")` spread** — mặc định cho `Input`/`TextArea` text thuần. Gọn nhất, ưu tiên khi không cần logic thêm.
  ✅ `src/components/modals/ManagePinnedProjectsModal/ExternalProjectForm/index.tsx`: `<Input id="pin-title" {...register("title")} />`.
- **`Controller` render-prop** — khi field cần `fieldState` (isInvalid/isTouched) hoặc bọc control tùy biến.
  ✅ `src/components/layouts/admin/AdminLogin/index.tsx`:
```tsx
<Controller control={control} name="apiKey" render={({ field, fieldState }) => (
    <TextField variant="secondary" isInvalid={fieldState.invalid && fieldState.isTouched}>
        <Input name={field.name} ref={field.ref} value={field.value}
            onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />
        <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
)} />
```
- **`watch("name")` + `setValue("name", v)`** — BẮT BUỘC cho control non-native (HeroUI `Select.Root` dùng `selectedKey`/`onSelectionChange`) và khi truyền value/`setValue` xuống section con.
  ✅ `src/components/features/careers/Jobs/JobPostForm/PositionSection/index.tsx`: `value={title} onChange={(event) => setValue("title", event.target.value)}`; Select: `onSelectionChange={(key) => setValue("employmentType", …)}`.
- ❌ Trộn `register` với `value={watch(...)}` trên cùng 1 input (double-control). Một field: một cách.

## 8. Hiển thị lỗi — dưới field, `body-xs` + `text-danger-soft-foreground`; đánh dấu `isInvalid` trên `TextField`

- Text field (register/watch): render có điều kiện `errors.x ? <Typography slot="description"|"errorMessage" type="body-xs" className="text-danger-soft-foreground">{errors.x.message}</Typography> : null` — dùng `? : null`, KHÔNG `&&`.
- Controller: `<FieldError>{fieldState.error?.message}</FieldError>` (HeroUI FieldError).
- Đánh dấu invalid: `isInvalid={Boolean(errors.title)}` trên `<TextField>`.
- ✅ `src/components/.../ExternalProjectForm/index.tsx`: `<TextField variant="secondary" isInvalid={Boolean(errors.title)}>` + `{errors.title ? <Typography slot="errorMessage" …/> : null}`.
- ❌ `alert()` / toast cho lỗi validate field-level — lỗi field hiển thị inline; toast chỉ cho lỗi API/nghiệp vụ (mục 5).

## 9. Nút submit — `type="submit"` + `isPending={isSubmitting}` + spinner tay

- Lấy `isSubmitting` từ `formState`. `isPending` một mình KHÔNG hiện spinner → tự render `<Spinner/>` (hoặc đổi label). Có thể `isDisabled` khi submitting/invalid.
- ✅ `src/components/.../ExternalProjectForm/index.tsx`:
```tsx
<Button type="submit" variant="primary" fullWidth isDisabled={isSubmitting} isPending={isSubmitting}>
    {({ isPending }) => (<>{isPending ? <Spinner color="current" size="sm" /> : null}{t("pinnedProjects.form.submit")}</>)}
</Button>
```
- ✅ `ContactForm`: `<Button type="submit" isPending={isSubmitting}>{isSubmitting ? t("...submitting") : t("...submit")}</Button>` (đổi label thay spinner cũng hợp lệ).
- ❌ `<Button onPress={onSubmit}>` — submit đi qua `<form onSubmit>` + `type="submit"`, không gắn onPress.

## 10. Ngoại lệ: không phải form nào cũng RHF — nhưng phải mimic interface

- Form có nhu cầu đặc biệt (field-array lồng + auto-save debounce) được hand-roll, NHƯNG trả về shape tương thích để consumer không đổi.
- ✅ `src/hooks/rhf/useEditSubmissionForm.ts`: cố ý KHÔNG RHF, trả `{ values, errors, touched, setFieldValue, setFieldTouched, isSubmitting }` (shape formik-like) cho `ChallengeSubmissionPanel`.
- Mặc định vẫn là RHF+zod (mục 1); chỉ lệch khi có lý do rõ và giữ interface nhất quán.
