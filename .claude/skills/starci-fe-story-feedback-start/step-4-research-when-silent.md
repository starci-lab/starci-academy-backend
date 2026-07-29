# B4 — TRA CỨU KHI CANON CÂM

> **Chạy khi:** ma trận B2 có ô ra **`CÂM`**. Không chạy cho `ĐẠT`, `LỆCH`, hay `N/A`.
> **Ra:** một ĐỀ XUẤT cho thầy. Read-only với canon — bước này **không được ghi** vào
> `principles/`.

Canon câm nghĩa là trò đang **lú thật**: trục áp được, nhưng đi hết cây quyết định mà không
nhánh nào nhận ca này. Lúc đó có hai đường sai và một đường đúng.

| | |
|---|---|
| ❌ Sai 1 | **Tự chọn đại một giá trị** rồi đi tiếp. Không ai biết đó là quyết định chứ không phải luật, và lần sau nó thành tiền lệ giả |
| ❌ Sai 2 | **Ghi `N/A` cho khuất mắt.** Lỗ hổng canon biến mất khỏi sổ, phiên sau lại lú đúng chỗ đó |
| ✅ Đúng | **Đi tra ngành, mang về ĐỀ XUẤT có dẫn nguồn cho thầy quyết** |

---

## VÀO

Một ô `CÂM` từ B2: trục nào, vùng nào, câu hỏi cụ thể không trả lời được là gì.

## LÀM

### 1. Trước tiên phân loại: câm này có tra được không?

Đây là bước quan trọng nhất, làm sai là tra cả buổi ra thứ vô dụng.

| Loại câm | Dấu hiệu | Xử |
|---|---|---|
| **Câm vì chưa ai gặp** | câu hỏi có đáp án **khách quan**: cỡ bao nhiêu, tương phản đủ chưa, thứ tự tab thế nào, chạm bao nhiêu px thì đủ | ✅ **tra được** — ngành đã trả lời rồi |
| **Câm vì đây là quyết định SẢN PHẨM** | câu hỏi kiểu "màn này cái gì quan trọng nhất", "có nên hiện số này không", "nói câu gì ở đây" | ⛔ **KHÔNG tra được** — internet không biết sản phẩm của thầy. **Hỏi thầy thẳng**, đừng đi tra rồi mang về một câu trả lời giả khách quan |

🧭 Phép thử: **hai người cùng đọc kỹ tài liệu ngành có ra cùng đáp án không?** Có ⇒ tra được.
Không ⇒ đó là quyết định, hỏi thầy.

### 2. Tra, theo thứ tự thẩm quyền

Xuống dần. Tìm được ở tầng trên thì không cần xuống tầng dưới.

| # | Nguồn | Vì sao xếp ở đây |
|---|---|---|
| 1 | **Spec chuẩn** — W3C, WCAG, WAI-ARIA | có thẩm quyền cao nhất, và phần lớn **đo được** chứ không phải ý kiến |
| 2 | **Design system lớn có CÔNG BỐ LÝ DO** — Material, Apple HIG, Carbon, Polaris, Atlassian, Primer, Radix | không lấy con số của họ, lấy **lập luận** của họ |
| 3 | **Tài liệu của chính thư viện đang dùng** — HeroUI, Tailwind, react-aria | khớp thẳng với code mình đang chạy |
| 4 | Bài viết cá nhân, blog | chỉ làm **tham khảo**, không bao giờ làm căn cứ một mình |

**Ngưỡng: đủ HAI nguồn ĐỘC LẬP** cùng ra một kết luận thì mới được đề xuất thành luật chung.
Chỉ một nguồn ⇒ vẫn trình được, nhưng phải ghi rõ *"một nguồn, chưa đủ để thành luật"*. Đây
đúng ngưỡng canon đang dùng cho mọi luật khác, internet không được hạ chuẩn.

### 3. Dịch sang thang của NHÀ MÌNH

Đây là chỗ dễ hỏng nhất. **Không chép số của họ.**

Ngành nói "chạm tối thiểu 44px" thì đề xuất phải nói bậc nào trong thang mình đạt được điều đó,
chứ không phải thêm một giá trị `44px` lạc ra ngoài thang. Ngành có sáu bậc mà mình có bốn thì
phải **ánh xạ**, không phải nhập khẩu.

Nếu dịch xong thấy **thang mình thiếu bậc thật** thì đó chính là đề xuất — nói rõ ra, đừng lặng
lẽ khai ngoại lệ để né.

## VẠCH CẤM CỦA BƯỚC NÀY

- ⛔ **Internet KHÔNG bao giờ đè được neo đo tại chỗ.** Luật xuyên trục 1 ở `INDEX.md`: neo thật
  ghi đè suy luận. Component có nguồn thật thì ĐO nguồn đó và dùng số đo được, kể cả khi cả
  ngành làm khác. Internet chỉ dùng cho chỗ canon **câm**, không dùng để cãi chỗ canon đã nói.
- ⛔ **Không nói "ngành làm thế" mà không dẫn tên nguồn.** Câu đó không kiểm chứng được nên nó
  không phải bằng chứng, nó là ý kiến đội lốt.
- ⛔ **Không ghi thẳng vào `principles/`.** Bước này ra ĐỀ XUẤT. Thầy duyệt rồi
  `starci-fe-story-feedback-end` mới ghi.
- ⛔ **Không tra cho ô `LỆCH`.** Canon đã trả lời rồi, đi tìm nguồn ngoài để cãi lại canon là
  đảo ngược thứ tự thẩm quyền.

## RA

Ghi vào `session.md` mục `còn treo`, theo khuôn:

```markdown
### CÂM — <trục> · <vùng>
- câu hỏi canon không trả lời: <viết ra cho rõ>
- loại: tra được | quyết định sản phẩm (nếu là quyết định thì DỪNG, hỏi thầy)
- nguồn 1: <tên + link> — nói gì
- nguồn 2: <tên + link> — nói gì
- hai nguồn có đồng ý không: <có/không, khác nhau chỗ nào>
- dịch sang thang nhà mình: <bậc nào, hay thang đang thiếu bậc>
- ĐỀ XUẤT: <một câu luật, viết đủ tổng quát để áp cho ca sau khác hình nhưng cùng bản chất>
- neo vào đâu: <trục nào, mục nào — §1 thang / §2 cây / §3 cặp / §4 bẫy / §6 vạch cấm>
```

Trình cho thầy **trong cùng vòng**, đừng để dồn tới cuối phiên — thầy đang nhìn đúng màn đó,
để sang phiên sau là mất ngữ cảnh.

## DỪNG KHI

- Loại câm là **quyết định sản phẩm** ⇒ dừng ngay, hỏi thầy. Đừng tra.
- Tra mà **hai nguồn nói ngược nhau** ⇒ trình cả hai kèm lập luận từng bên, để thầy chọn. Đừng
  tự chọn bên rồi giấu bên kia.
- Tra mà **không thấy nguồn nào** ⇒ nói thẳng là ngành cũng chưa có chuẩn. Đó là thông tin thật
  và hữu ích, không phải thất bại.
