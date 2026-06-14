import React from "react"
import ReactDOM from "react-dom/client"
import { I18nProvider } from "@heroui/react"
import { App } from "./App"
import "./styles.css"

// mount the single-page ops dashboard inside HeroUI's i18n provider
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <I18nProvider>
            <App />
        </I18nProvider>
    </React.StrictMode>,
)
