# STEP 1 — VẼ CÂY + CHỐT BỘ STATE

> Phase 1 của workflow. Gồm **S3 · S4**. 1 agent, và **kết thúc bằng BARRIER**: cả hai bước
> đều DỪNG cho thầy duyệt trước khi ai gõ code.
> Luật cần đọc: [`rules/1-decompose.md`](../rules/1-decompose.md) (cây + ai import gì) ·
> [`rules/2-leaf-states.md`](../rules/2-leaf-states.md) §5 (bảng vét cạn state).

---

## S3 · Vẽ CÂY lý tưởng + danh sách chức năng

| | |
|---|---|
| **VÀO** | closure từ Phase 0 |
| **LÀM** | B1 → viết **danh sách chức năng bằng lời**, chưa nghĩ hình. B2 → chọn khung (`Container`/`Stack`/`Grid`). B3 → mỗi chức năng gọi đúng MỘT block. Vẽ cây `khung → block → design → layout → atom` |
| **CỔNG ĐO** | đọc tên block có ra được **trang làm gì** không · mỗi node kiểm bảng "ai import gì" (`rules/1` §2) |
| **RA** | cây dạng text + bảng `node · tầng · WHY tồn tại` |
| **DỪNG KHI** | **LUÔN DỪNG.** Gộp họ · dời tầng · đặt lại category = **thầy chốt** |

Khuôn cây (ca thật `CourseContents`):

```
Container                     layout   ← khổ đọc + đệm trang
  Stack.V  gap-8              layout   ← tách VÙNG
    CourseBrief               block    → Page.Header
    Stack.V  gap-6            layout   ← nhịp giữa các block
      CourseTeamGate          block    → Feedback.Callout
      TrialConversionStrip    block    → SurfaceCard ⊃ PriceTag · PhaseScarcityNote
      ContinueLearning        block    → ContinueCard (design)
      LearnNudges             block    → SurfaceCard.List
      KeepGoingPath           block    → SurfaceCard.List
```

---

## S4 · Chốt BỘ STATE từng block

| | |
|---|---|
| **VÀO** | cây đã duyệt |
| **LÀM** | mỗi block điền bảng 4 cột |
| **CỔNG ĐO** | mỗi state phải chỉ ra **dữ liệu nào** sinh ra nó; không chỉ ra được ⇒ **state bịa** |
| **RA** | bảng state — vừa là spec dựng, vừa là **tài liệu nghiệp vụ** |
| **DỪNG KHI** | thiếu **ngưỡng / câu chữ nghiệp vụ** ⇒ hỏi thầy, **CẤM bịa** (§14d.3) |

Bảng bắt buộc, 4 cột:

| State | Điều kiện nghiệp vụ | Hình đổi gì | Leaf hay state |
|---|---|---|---|
| tên ngắn | dữ liệu nào sinh ra nó | node nào mọc/mất, hay chỉ đổi chữ | theo phép thử `rules/2` §0 |

Mẫu đã điền thật — `PhaseScarcityNote`:

| State | Điều kiện | Hình đổi | Kết luận |
|---|---|---|---|
| đủ hai vế | `seats = N` + `nextPhasePriceVnd != null` | 4 item | **state** |
| không có vế tăng giá | `nextPhasePriceVnd == null` | **rụng** `Separator` + `PriceRiseClause` | **state** |
| không giới hạn suất | `seatsRemaining == null` | **render null** | **state** |
| hết suất | `seats = 0` | CHƯA CÓ — hiện in `"Còn 0 suất"`, sai nghiệp vụ | **chờ thầy** |
| gấp | `seats` nhỏ | CHƯA CÓ — không có bậc tone gấp | **chờ thầy** |

Neo thật: chính việc điền bảng này mới lộ ra **2 state thiếu**, và `_legacy` từng có đủ bậc (`--few-seats` · `--one-seat-left`) ⇒ **thang gấp là ý định gốc, bị mất khi port**.

---

## Ra khỏi Phase 1 khi

- [ ] thầy đã duyệt cây
- [ ] mỗi block có bảng 4 cột điền đủ
- [ ] mọi state đều chỉ ra được dữ liệu sinh ra nó
- [ ] mọi câu "chờ thầy" đã được trả lời (ngưỡng, câu chữ nghiệp vụ)
