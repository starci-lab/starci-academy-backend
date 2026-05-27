# 02 — Challenge System

## §02.1 Bản chất Challenge
- **Challenge** = bài tập có rubric, học viên submit để được chấm.
- Mỗi Lesson có **ít nhất 1 challenge** (thường 4 tier).
- Challenge có **prerequisite** trỏ đến challenge tier thấp hơn của cùng lesson hoặc lesson trước.

## §02.2 Bốn tier
| Tier | Index folder | Score sum | Mục đích |
|---|---|---|---|
| Easy | `0-...-easy` | 20 pts (4 req × 5) | Làm quen khái niệm, smoke test |
| Medium | `1-...-medium` | 40 pts (4 req × 10) | Thực chiến cơ bản |
| Hard | `2-...-hard` | 60 pts (4 req × 15) | Mở rộng từ medium — production-like |
| Insane | `3-...-insane` | 80 pts (4 req × 20) | Mở rộng từ hard — scale + chaos + benchmark |

## §02.3 Prerequisite chain
- **Easy** prereq: lesson hoặc challenge của lesson trước.
- **Medium** prereq: `Đã hoàn thành EASY <easy-slug>`.
- **Hard** prereq: `Đã hoàn thành MEDIUM <medium-slug>`.
- **Insane** prereq: `Đã hoàn thành HARD <hard-slug>`.
- Học viên không submit được tier cao nếu chưa pass prereq.

## §02.4 Yêu cầu submission
Mỗi challenge yêu cầu học viên nộp:
- **Output** (artifact: file, link repo, screenshot…)
- Trả lời các **submission prompt** (câu hỏi tự luận để chấm hiểu/áp dụng)
- Một số tier (hard/insane) bắt buộc có **benchmark** + **chaos test evidence** + **README**.

## §02.5 Chấm điểm
- Mỗi challenge có **4 requirement**, mỗi req chia thành **criteria** với điểm cụ thể.
- Tổng điểm = sum criteria khớp tier (20/40/60/80).
- Có **forbidden bullet** — vi phạm = trừ tối đa requirement đó (`0 whole challenge` = trừ cả challenge).

## §02.6 Submission lifecycle
```
Student submit → submission record
  └─ attempt (mỗi lần submit là 1 attempt)
      └─ feedback (consultant/admin chấm + comment)
```
- Học viên có thể **resubmit nhiều lần** (multiple attempts).
- Feedback cuối cùng quyết định pass/fail.
- Mỗi attempt có timestamp + state (pending / reviewing / passed / rejected).

## §02.7 Code implementation đa ngôn ngữ
- Mỗi **challenge step** có thể đính kèm **code implementation** mẫu cho 4 ngôn ngữ.
- Thứ tự ngôn ngữ chuẩn:
  - **SD (System Design Mastery):** TypeScript → C# → Go → Java
  - **FS (Full Stack Mastery):** TypeScript only (codebase dùng TS)
- Mỗi implementation có: thư viện chính, mapping API, khác biệt/gotcha.

## §02.8 Difficulty escalation
- Description Hard bắt đầu bằng: `Phát triển từ bản MEDIUM.` / `Extended from the MEDIUM version.`
- Description Insane bắt đầu bằng: `Phát triển từ bản HARD.` / `Extended from the HARD version.`
- Insane luôn thêm yếu tố: scale (1M+ ops), multi-region, chaos test, capacity model.

## §02.9 Quy tắc giữ chất lượng
- **Không bịa số liệu benchmark** — học viên phải nộp evidence thực.
- **Không skip chaos test** ở hard/insane.
- **Không mock production-critical components** (vd: mock DB cho integration test = trừ điểm).
- Bilingual: cùng requirement count + score sum + separator position giữa VI và EN.
