import { useState } from "react"
import { Button, Chip } from "@heroui/react"
import { del, postForm, postJson } from "./api"
import type {
    PgSnapshotRow,
} from "./types/panels"
import {
    Block,
    Field,
    FileField,
    Outcome,
    SubmitButton,
    useAction,
    useToolsData,
} from "./ui"

/** Multi-target picker (checkbox list) bound to the shared targets list. */
const TargetMultiPicker = (
    { value, onChange }: { value: Array<string>; onChange: (ids: Array<string>) => void },
) => {
    const { targets } = useToolsData()
    const toggle = (id: string) =>
        onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">S3 targets (chọn nhiều để đẩy cùng lúc)</label>
            {targets.length === 0 ? (
                <div className="text-sm text-muted">Chưa có target — tạo ở tab Targets.</div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {targets.map((t) => (
                        <label key={t.id} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-default px-3 py-2">
                            <input
                                type="checkbox"
                                className="size-4 accent-[var(--accent)]"
                                checked={value.includes(t.id)}
                                onChange={() => toggle(t.id)}
                            />
                            <span className="text-sm">{t.name}</span>
                            <span className="text-xs text-muted">({t.bucket})</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

/** Manage saved S3 targets (persisted in the local SQLite store). */
export const TargetsPanel = () => {
    const { targets, refresh } = useToolsData()
    const [f, setF] = useState({ name: "", endpoint: "", region: "us-east-1", accessKeyId: "", secretAccessKey: "", bucket: "" })
    const action = useAction<unknown>()
    const del_ = useAction<unknown>()
    const set = (patch: Partial<typeof f>) => setF((v) => ({ ...v, ...patch }))
    return (
        <Block title="S3 targets" hint="Đích lưu trữ (creds trong SQLite local). Chọn lại trong các tool build.">
            <div className="flex flex-col gap-3">
                <Field label="Tên" value={f.name} onChange={(v) => set({ name: v })} placeholder="vd: minio-local" />
                <Field label="Endpoint" value={f.endpoint} onChange={(v) => set({ endpoint: v })} placeholder="https://…" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Region" value={f.region} onChange={(v) => set({ region: v })} />
                    <Field label="Bucket" value={f.bucket} onChange={(v) => set({ bucket: v })} />
                </div>
                <Field label="Access key id" value={f.accessKeyId} onChange={(v) => set({ accessKeyId: v })} />
                <Field label="Secret access key" type="password" value={f.secretAccessKey} onChange={(v) => set({ secretAccessKey: v })} />
                <SubmitButton
                    pending={action.pending}
                    disabled={!f.name || !f.endpoint || !f.bucket}
                    onPress={() => action.run(async () => {
                        const r = await postJson("/targets", f)
                        refresh()
                        return r
                    })}
                >
                    Lưu target
                </SubmitButton>
            </div>

            {targets.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    {targets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-default px-3 py-2">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{t.name}</div>
                                <div className="truncate text-xs text-muted">{t.bucket} · {t.endpoint}</div>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onPress={() => del_.run(async () => {
                                    const r = await del(`/targets/${t.id}`)
                                    refresh()
                                    return r
                                })}
                            >
                                Xoá
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: raw upload file(s) as-is to one or more targets. */
export const UploadPanel = () => {
    const { refresh } = useToolsData()
    const [files, setFiles] = useState<Array<File>>([])
    const [targetIds, setTargetIds] = useState<Array<string>>([])
    const [keyPrefix, setKeyPrefix] = useState("uploads")
    const action = useAction<unknown>()
    return (
        <Block title="Upload (raw)" hint="Đẩy thẳng file gốc (không encode) lên các target đã chọn cùng lúc.">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted">File(s)</label>
                <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles([...(e.target.files ?? [])])}
                    className="bg-field-background rounded-2xl border px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-accent-foreground"
                />
            </div>
            <TargetMultiPicker value={targetIds} onChange={setTargetIds} />
            <Field label="Key prefix" value={keyPrefix} onChange={setKeyPrefix} />
            <SubmitButton
                pending={action.pending}
                disabled={files.length === 0}
                onPress={() => action.run(async () => {
                    const form = new FormData()
                    files.forEach((f) => form.append("files", f))
                    form.append("targetIds", JSON.stringify(targetIds))
                    if (keyPrefix) form.append("keyPrefix", keyPrefix)
                    const r = await postForm("/upload/process", form)
                    refresh()
                    return r
                })}
            >
                Upload & sync
            </SubmitButton>
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: encode an uploaded video to multi-bitrate mp4, then sync. */
export const MediaPanel = () => {
    const { refresh } = useToolsData()
    const [file, setFile] = useState<File | null>(null)
    const [targetIds, setTargetIds] = useState<Array<string>>([])
    const [keyPrefix, setKeyPrefix] = useState("")
    const action = useAction<unknown>()
    return (
        <Block title="Encode mp4" hint="Encode 1080/720/480/360 ở local, rồi sync lên các target.">
            <FileField label="Video nguồn" onChange={setFile} />
            <TargetMultiPicker value={targetIds} onChange={setTargetIds} />
            <Field label="Key prefix (tuỳ chọn)" value={keyPrefix} onChange={setKeyPrefix} />
            <SubmitButton
                pending={action.pending}
                disabled={!file}
                onPress={() => action.run(async () => {
                    const form = new FormData()
                    form.append("file", file!)
                    form.append("targetIds", JSON.stringify(targetIds))
                    if (keyPrefix) form.append("keyPrefix", keyPrefix)
                    const r = await postForm("/media/process", form)
                    refresh()
                    return r
                })}
            >
                Encode & sync
            </SubmitButton>
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: package an uploaded video to MPEG-DASH, then sync. */
export const DashPanel = () => {
    const { refresh } = useToolsData()
    const [file, setFile] = useState<File | null>(null)
    const [targetIds, setTargetIds] = useState<Array<string>>([])
    const [keyPrefix, setKeyPrefix] = useState("")
    const action = useAction<unknown>()
    return (
        <Block title="Video → MPEG-DASH" hint="Encode + fragment + manifest ở local (cache), rồi sync lên các target.">
            <FileField label="Video nguồn" onChange={setFile} />
            <TargetMultiPicker value={targetIds} onChange={setTargetIds} />
            <Field label="Key prefix (tuỳ chọn)" value={keyPrefix} onChange={setKeyPrefix} />
            <SubmitButton
                pending={action.pending}
                disabled={!file}
                onPress={() => action.run(async () => {
                    const form = new FormData()
                    form.append("file", file!)
                    form.append("targetIds", JSON.stringify(targetIds))
                    if (keyPrefix) form.append("keyPrefix", keyPrefix)
                    const r = await postForm("/dash/process", form)
                    refresh()
                    return r
                })}
            >
                Package & sync
            </SubmitButton>
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: snapshot a list of cloud Postgres DBs to local files. */
export const PgSnapshotPanel = () => {
    const { refresh } = useToolsData()
    const [rows, setRows] = useState<Array<PgSnapshotRow>>([{ name: "", url: "" }])
    const action = useAction<unknown>()
    const update = (i: number, patch: Partial<PgSnapshotRow>) =>
        setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
    return (
        <Block title="Snapshot → file local" hint="Dump nhiều DB cloud ra file .dump ở máy.">
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr] gap-3">
                    <Field label="Tên" value={row.name} onChange={(v) => update(i, { name: v })} />
                    <Field label="Postgres URL" value={row.url} onChange={(v) => update(i, { url: v })} placeholder="postgres://…" />
                </div>
            ))}
            <div className="flex gap-3">
                <Button variant="secondary" size="lg" onPress={() => setRows((rs) => [...rs, { name: "", url: "" }])}>
                    + Thêm
                </Button>
                <SubmitButton
                    pending={action.pending}
                    disabled={rows.every((r) => !r.url)}
                    onPress={() => action.run(async () => {
                        const r = await postJson("/pg/snapshot", { targets: rows.filter((x) => x.url) })
                        refresh()
                        return r
                    })}
                >
                    Snapshot
                </SubmitButton>
            </div>
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: back up a database to a local disk (encrypted) + optional sync. */
export const PgBackupPanel = () => {
    const { refresh } = useToolsData()
    const [f, setF] = useState({ postgresUrl: "", diskPath: "", artifactBaseName: "db", keyPrefix: "" })
    const [targetIds, setTargetIds] = useState<Array<string>>([])
    const action = useAction<unknown>()
    const set = (patch: Partial<typeof f>) => setF((v) => ({ ...v, ...patch }))
    return (
        <Block title="Backup → ổ đĩa + cloud" hint="pg_dump → gzip → encrypt lên ổ đĩa, rồi sync. Cần BACKUP_ENCRYPT_PASSWORD.">
            <Field label="Postgres URL" value={f.postgresUrl} onChange={(v) => set({ postgresUrl: v })} placeholder="postgres://…" />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Ổ đĩa" value={f.diskPath} onChange={(v) => set({ diskPath: v })} placeholder="E:/backups" />
                <Field label="Tên artifact" value={f.artifactBaseName} onChange={(v) => set({ artifactBaseName: v })} />
            </div>
            <TargetMultiPicker value={targetIds} onChange={setTargetIds} />
            <Field label="Key prefix (tuỳ chọn)" value={f.keyPrefix} onChange={(v) => set({ keyPrefix: v })} />
            <SubmitButton
                pending={action.pending}
                disabled={!f.postgresUrl || !f.diskPath}
                onPress={() => action.run(async () => {
                    const r = await postJson("/pg/backup", { ...f, targetIds, keyPrefix: f.keyPrefix || undefined })
                    refresh()
                    return r
                })}
            >
                Backup
            </SubmitButton>
            <Outcome {...action} />
        </Block>
    )
}

/** Tool: snapshot a remote S3 bucket to local disk. */
export const S3SnapshotPanel = () => {
    const { refresh } = useToolsData()
    const [f, setF] = useState({ endpoint: "", region: "us-east-1", accessKeyId: "", secretAccessKey: "", bucket: "", prefix: "" })
    const action = useAction<unknown>()
    const set = (patch: Partial<typeof f>) => setF((v) => ({ ...v, ...patch }))
    return (
        <Block title="S3 bucket → snapshot local" hint="Tải toàn bộ object của bucket remote về máy để sync lại sau.">
            <Field label="Endpoint" value={f.endpoint} onChange={(v) => set({ endpoint: v })} placeholder="https://…" />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Region" value={f.region} onChange={(v) => set({ region: v })} />
                <Field label="Bucket" value={f.bucket} onChange={(v) => set({ bucket: v })} />
            </div>
            <Field label="Access key id" value={f.accessKeyId} onChange={(v) => set({ accessKeyId: v })} />
            <Field label="Secret access key" type="password" value={f.secretAccessKey} onChange={(v) => set({ secretAccessKey: v })} />
            <Field label="Prefix (tuỳ chọn)" value={f.prefix} onChange={(v) => set({ prefix: v })} />
            <SubmitButton
                pending={action.pending}
                disabled={!f.endpoint || !f.bucket}
                onPress={() => action.run(async () => {
                    const r = await postJson("/s3/snapshot", { ...f, prefix: f.prefix || undefined })
                    refresh()
                    return r
                })}
            >
                Snapshot bucket
            </SubmitButton>
            <Outcome {...action} />
        </Block>
    )
}

/** Status chip colour by artifact status. */
const statusColor = (status: string): "success" | "danger" | "default" =>
    status === "synced" ? "success" : status === "error" ? "danger" : "default"

/** The artifact registry: list, re-sync, delete. Optionally filtered by type. */
export const ArtifactsPanel = ({ types }: { types?: Array<string> }) => {
    const { artifacts, refresh } = useToolsData()
    const action = useAction<unknown>()
    const list = types ? artifacts.filter((a) => types.includes(a.type)) : artifacts
    return (
        <Block title="Artifacts" hint="Cache local-first. Re-sync đẩy lại (mọi target) không tính lại.">
            <div className="flex flex-col gap-1.5">
                {list.length === 0 && <div className="text-sm text-muted">Chưa có artifact nào.</div>}
                {list.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-default px-3 py-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <Chip size="sm" variant="soft" color={statusColor(a.status)}>
                                    <Chip.Label>{a.status}</Chip.Label>
                                </Chip>
                                <span className="truncate text-sm font-medium">{a.label ?? a.id.slice(0, 8)}</span>
                            </div>
                            <div className="truncate text-xs text-muted">
                                {a.type}
                                {a.bytes != null ? ` · ${(a.bytes / 1_000_000).toFixed(2)} MB` : ""}
                                {a.targetIds.length > 0 ? ` · ${a.targetIds.length} target` : ""}
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                            {a.targetIds.length > 0 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onPress={() => action.run(async () => {
                                        const r = await postJson(`/artifacts/${a.id}/resync`, {})
                                        refresh()
                                        return r
                                    })}
                                >
                                    Re-sync
                                </Button>
                            )}
                            <Button
                                variant="danger"
                                size="sm"
                                onPress={() => action.run(async () => {
                                    const r = await del(`/artifacts/${a.id}`)
                                    refresh()
                                    return r
                                })}
                            >
                                Xoá
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <Outcome {...action} />
        </Block>
    )
}
