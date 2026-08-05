import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Alert, Button, Input, Spinner } from "@heroui/react"
import { getJson } from "./api"
import type {
    Artifact,
    Target,
} from "./types/api"
import type {
    BlockProps,
    SelectFieldProps,
    SubmitButtonProps,
} from "./types/ui"

/* ------------------------------------------------------------------ */
/* Async action hook + outcome renderer                                */
/* ------------------------------------------------------------------ */

/** Tracks pending/result/error for one panel action. */
export const useAction = <T,>() => {
    const [pending, setPending] = useState(false)
    const [result, setResult] = useState<T | null>(null)
    const [error, setError] = useState<string | null>(null)
    const run = useCallback(async (fn: () => Promise<T>) => {
        setPending(true)
        setError(null)
        setResult(null)
        try {
            setResult(await fn())
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e))
        } finally {
            setPending(false)
        }
    }, [])
    return { pending, result, error, run }
}

/** Renders an action's pending spinner, error alert or result JSON. */
export const Outcome = (
    { pending, result, error }: { pending: boolean; result: unknown; error: string | null },
) => {
    if (pending) {
        return (
            <div className="flex items-center gap-1.5 text-sm text-muted">
                <Spinner size="sm" />
                Đang chạy…
            </div>
        )
    }
    if (error) {
        return (
            <Alert status="danger" className="text-sm">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Description className="break-words">{error}</Alert.Description>
                </Alert.Content>
            </Alert>
        )
    }
    if (result != null) {
        return (
            <pre className="bg-default max-h-60 overflow-auto rounded-xl p-3 text-xs whitespace-pre-wrap text-foreground">
                {JSON.stringify(result, null, 2)}
            </pre>
        )
    }
    return null
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

/** A labelled text input (label↔input coupled → gap-1.5). */
export const Field = (
    {
        label,
        value,
        onChange,
        placeholder,
        type = "text",
    }: {
        label: string
        value: string
        onChange: (v: string) => void
        placeholder?: string
        type?: string
    },
) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted">{label}</label>
        <Input
            variant="secondary"
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
)

/** A labelled native file input styled as a field. */
export const FileField = (
    { label, onChange }: { label: string; onChange: (f: File | null) => void },
) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted">{label}</label>
        <input
            type="file"
            accept="video/*"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            className="bg-field-background rounded-2xl border px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-accent-foreground"
        />
    </div>
)

/** A labelled native select styled as a field (used for target pickers). */
export const SelectField = (
    {
        label,
        value,
        onChange,
        children,
    }: SelectFieldProps,
) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-field-background h-10 rounded-2xl border px-3 text-sm text-foreground outline-none focus:border-accent"
        >
            {children}
        </select>
    </div>
)

/** A primary submit button that disables + shows a spinner while pending. */
export const SubmitButton = (
    {
        pending,
        disabled,
        onPress,
        children,
    }: SubmitButtonProps,
) => (
    <Button variant="primary" size="lg" fullWidth isDisabled={pending || disabled} onPress={onPress}>
        {pending ? <Spinner size="sm" color="current" /> : children}
    </Button>
)

/** A titled block inside a tab panel (heading↔body same-function → gap-3). */
export const Block = (
    { title, hint, children }: BlockProps,
) => (
    <div className="flex flex-col gap-3">
        <div>
            <div className="text-lg font-semibold">{title}</div>
            {hint ? <div className="text-sm text-muted">{hint}</div> : null}
        </div>
        {children}
    </div>
)

/* ------------------------------------------------------------------ */
/* Shared data (targets + artifacts) context                           */
/* ------------------------------------------------------------------ */

/** Shape of the shared tools data context. */
interface ToolsData {
    targets: Array<Target>
    artifacts: Array<Artifact>
    refresh: () => void
}

const ToolsDataContext = createContext<ToolsData>({
    targets: [],
    artifacts: [],
    refresh: () => undefined,
})

/** Provides the saved targets + artifact registry to every panel. */
export const ToolsDataProvider = ({ children }: { children: ReactNode }) => {
    const [targets, setTargets] = useState<Array<Target>>([])
    const [artifacts, setArtifacts] = useState<Array<Artifact>>([])

    const refresh = useCallback(() => {
        getJson<Array<Target>>("/targets").then(setTargets).catch(() => undefined)
        getJson<Array<Artifact>>("/artifacts").then(setArtifacts).catch(() => undefined)
    }, [])

    // load both lists once on mount
    useEffect(() => {
        refresh()
    }, [refresh])

    return (
        <ToolsDataContext.Provider value={{ targets, artifacts, refresh }}>
            {children}
        </ToolsDataContext.Provider>
    )
}

/** Read the shared targets + artifacts + refresh callback. */
export const useToolsData = (): ToolsData => useContext(ToolsDataContext)
