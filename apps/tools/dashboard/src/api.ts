// Thin fetch helpers for the tools REST API. Same-origin in the served build
// ("/api/..."), proxied to the backend in `vite dev`.

/** Base path of the tools REST API. */
const API_BASE = "/api/v1/tools"

/** Throw a useful error from a non-2xx response. */
const ensureOk = async (response: Response): Promise<string> => {
    const text = await response.text()
    if (!response.ok) {
        throw new Error(text || `Request failed: ${response.status}`)
    }
    return text
}

/** GET a JSON resource. */
export const getJson = async <T,>(path: string): Promise<T> => {
    const text = await ensureOk(await fetch(`${API_BASE}${path}`))
    return text ? (JSON.parse(text) as T) : ({
    } as T)
}

/** POST a JSON body and return the parsed JSON response. */
export const postJson = async <T,>(path: string, body: unknown): Promise<T> => {
    const text = await ensureOk(await fetch(`${API_BASE}${path}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(body),
        }))
    return text ? (JSON.parse(text) as T) : ({
    } as T)
}

/** POST a multipart form (file upload) and return the parsed JSON response. */
export const postForm = async <T,>(path: string, form: FormData): Promise<T> => {
    const text = await ensureOk(await fetch(`${API_BASE}${path}`,
        {
            method: "POST",
            body: form,
        }))
    return text ? (JSON.parse(text) as T) : ({
    } as T)
}

/** DELETE a resource and return the parsed JSON response. */
export const del = async <T,>(path: string): Promise<T> => {
    const text = await ensureOk(await fetch(`${API_BASE}${path}`,
        {
            method: "DELETE",
        }))
    return text ? (JSON.parse(text) as T) : ({
    } as T)
}
