import { useState } from "react"
import type { ReactNode } from "react"
import { Button, Card, Chip, Tabs } from "@heroui/react"
import { ToolsDataProvider } from "./ui"
import {
    ArtifactsPanel,
    DashPanel,
    MediaPanel,
    PgBackupPanel,
    PgSnapshotPanel,
    S3SnapshotPanel,
    TargetsPanel,
    UploadPanel,
} from "./panels"

/** Top-level sections rendered as the two landing cards. */
type Section = "home" | "db" | "media"

/** A tab entry in a detail section. */
interface TabDef {
    key: string
    label: string
    render: () => ReactNode
}

/** Tabs for the Database section. */
const DB_TABS: Array<TabDef> = [
    { key: "snapshot", label: "Snapshot", render: () => <PgSnapshotPanel /> },
    { key: "backup", label: "Backup", render: () => <PgBackupPanel /> },
    { key: "artifacts", label: "Artifacts", render: () => <ArtifactsPanel types={["pg-snapshot", "pg-backup"]} /> },
    { key: "targets", label: "Targets", render: () => <TargetsPanel /> },
]

/** Tabs for the Media section. */
const MEDIA_TABS: Array<TabDef> = [
    { key: "upload", label: "Upload", render: () => <UploadPanel /> },
    { key: "encode", label: "Encode mp4", render: () => <MediaPanel /> },
    { key: "dash", label: "MPEG-DASH", render: () => <DashPanel /> },
    { key: "s3", label: "S3 snapshot", render: () => <S3SnapshotPanel /> },
    { key: "artifacts", label: "Artifacts", render: () => <ArtifactsPanel types={["upload", "media", "dash", "s3-snapshot"]} /> },
    { key: "targets", label: "Targets", render: () => <TargetsPanel /> },
]

/** A landing card for one section (mirrors the course card look). */
const SectionCard = (
    { icon, title, desc, onOpen }: { icon: string; title: string; desc: string; onOpen: () => void },
) => (
    <Card>
        <Card.Content>
            <div className="flex h-32 items-center justify-center rounded-xl bg-accent/10 text-5xl">
                {icon}
            </div>
            <div className="mt-4 text-lg font-semibold">{title}</div>
            <div className="mt-1.5 line-clamp-2 text-sm text-muted">{desc}</div>
        </Card.Content>
        <Card.Footer>
            <Button variant="primary" size="lg" fullWidth onPress={onOpen}>
                Mở
            </Button>
        </Card.Footer>
    </Card>
)

/** The home screen: exactly two cards (Database + Media). */
const Home = ({ onOpen }: { onOpen: (s: Section) => void }) => (
    <div className="flex flex-col items-center">
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">StarCi Ops Tools</h1>
            <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>local-only · 404 prod</Chip.Label>
            </Chip>
        </div>
        <div className="mt-1.5 text-sm text-muted">Quản lý hạ tầng cloud từ máy local.</div>
        <div className="mt-6 grid w-full max-w-[760px] grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard
                icon="🐘"
                title="Database"
                desc="Snapshot nhiều Postgres cloud về file, hoặc backup mã hoá lên ổ đĩa + cloud."
                onOpen={() => onOpen("db")}
            />
            <SectionCard
                icon="🎬"
                title="Media"
                desc="Encode mp4 đa bitrate hoặc đóng gói MPEG-DASH ở local, rồi sync lên S3 target."
                onOpen={() => onOpen("media")}
            />
        </div>
    </div>
)

/** A detail screen: a center card whose features are split into tabs. */
const Detail = (
    { title, desc, tabs, onBack }: { title: string; desc: string; tabs: Array<TabDef>; onBack: () => void },
) => {
    const [tab, setTab] = useState(tabs[0].key)
    const active = tabs.find((t) => t.key === tab) ?? tabs[0]
    return (
        <div className="mx-auto w-full max-w-[1024px]">
            {/* breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-muted">
                <button className="hover:text-accent" onClick={onBack}>Tools</button>
                <span>/</span>
                <span className="text-foreground">{title}</span>
            </div>
            <div className="mt-3">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="mt-1.5 text-sm text-muted">{desc}</div>
            </div>

            {/* the center card whose features are tabs */}
            <Card className="mt-6 overflow-hidden p-0">
                <Card.Content className="p-0">
                    <div className="w-full border-b px-3">
                        <Tabs
                            variant="secondary"
                            selectedKey={tab}
                            onSelectionChange={(key) => setTab(String(key))}
                            className="w-full"
                        >
                            <Tabs.ListContainer className="w-full">
                                <Tabs.List aria-label={title} className="w-full border-b-0!">
                                    {tabs.map((t) => (
                                        <Tabs.Tab
                                            key={t.key}
                                            id={t.key}
                                            className="rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                                        >
                                            {t.label}
                                        </Tabs.Tab>
                                    ))}
                                </Tabs.List>
                            </Tabs.ListContainer>
                        </Tabs>
                    </div>
                    <div className="p-6">{active.render()}</div>
                </Card.Content>
            </Card>
        </div>
    )
}

/** The ops dashboard shell. */
export const App = () => {
    const [section, setSection] = useState<Section>("home")
    return (
        <ToolsDataProvider>
            <div className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-[1280px] p-3 py-12">
                    {section === "home" && <Home onOpen={setSection} />}
                    {section === "db" && (
                        <Detail
                            title="Database"
                            desc="Snapshot + backup PostgreSQL, local-first rồi sync cloud."
                            tabs={DB_TABS}
                            onBack={() => setSection("home")}
                        />
                    )}
                    {section === "media" && (
                        <Detail
                            title="Media"
                            desc="Encode mp4 / MPEG-DASH ở local (cache), rồi sync lên S3 target."
                            tabs={MEDIA_TABS}
                            onBack={() => setSection("home")}
                        />
                    )}
                </div>
            </div>
        </ToolsDataProvider>
    )
}
