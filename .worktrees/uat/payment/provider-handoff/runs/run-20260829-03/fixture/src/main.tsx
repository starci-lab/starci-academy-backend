import React from "react"
import { createRoot } from "react-dom/client"
import "./fixture.css"
import { CheckoutOverlayBase } from "D:/Repositories/starci-academy-fe/src/components/overlays/commerce/CheckoutOverlay/component"

const params = new URLSearchParams(window.location.search)
const state = params.get("state") === "recovery" ? "recovery" : "pending"

const labels = {
    title: "Kiểm tra thanh toán",
    subtitle: "1 khoá học sẽ được thêm sau khi thanh toán được xác nhận.",
    methodTitle: "Phương thức thanh toán",
    provider: "Chuyển khoản ngân hàng qua PayOS",
    providerDescription: "Bạn sẽ hoàn tất chuyển khoản trên trang thanh toán bảo mật của PayOS.",
    summary: {
        subtotal: "Tạm tính",
        savings: "Tiết kiệm",
        total: "Tổng",
    },
    processTitle: "Tiếp theo sẽ diễn ra thế nào",
    handoffStep: "Tiếp tục sang PayOS và hoàn tất chuyển khoản.",
    verificationStep: "Giao dịch giữ trạng thái chờ đến khi webhook PayOS xác nhận.",
    accessStep: "StarCi chỉ cấp quyền học sau xác nhận đó.",
    trustNote: "Việc trình duyệt quay về không tự động đánh dấu đơn hàng đã thanh toán.",
    action: "Tiếp tục đến PayOS · 16.625 ₫",
    cancel: "Quay lại giỏ hàng",
    failedMessage: "Chưa thể mở PayOS. Giỏ hàng vẫn được giữ nguyên; vui lòng thử lại.",
} as const

const root = document.getElementById("root")
if (root === null) throw new Error("UAT fixture root is missing")

createRoot(root).render(
    <React.StrictMode>
        <CheckoutOverlayBase
            props={{
                labels,
                isOpen: true,
                subtotal: "20.000 ₫",
                savings: "-3.375 ₫",
                total: "16.625 ₫",
                isPaying: state === "pending",
                hasFailed: state === "recovery",
            }}
        />
    </React.StrictMode>,
)
