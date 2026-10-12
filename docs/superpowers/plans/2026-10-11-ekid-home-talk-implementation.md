# eKid v2.9 — Trang chủ con khung trò chuyện AI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-home-talk-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration/API. TS strict; tiếng Việt; tái dùng VoiceAssistant.

---

### Task 1: Khối trò chuyện AI ở đầu trang chủ con
**Files:** `src/components/ekid/child/EkidTalkCard.tsx` (mới), `src/app/ekid/page.tsx`.
- [ ] `EkidTalkCard`: nhận `{ kid, remaining }`; chọn voice (favorite_voice hợp lệ → BAND_VOICE[ageBand]); `buildSystemInstruction({ kidName, placement, exercises: [] })`; render thẻ tiêu đề kiểu AI Mentor ("🎙️ Bạn AI của {tên}") chứa `<VoiceAssistant voice systemInstruction title />`; `remaining<=0` → thông báo hết giờ.
- [ ] `page.tsx`: fetch `/api/ekid/session?kid_id=` lấy `remaining`; chèn `EkidTalkCard` **đầu trang**; giữ thư viện bên dưới; bỏ/đổi nút hero cũ cho hợp lý (link "Xem bài học" cuộn xuống).
- [ ] Theme trẻ hài hoà (KID tokens/scope sáng).
- [ ] tsc + test + lint + `npm run build` sạch. Commit.

---

### Task 2: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify ekid.nooi.net/login 200, `/` 307→login khi chưa đăng nhập, service active.
- [ ] Repo sạch, push.

## Kiểm thử (Ngài An)
Đăng nhập tài khoản con → trang chủ hiện **khung trò chuyện với bạn AI** ngay đầu (bấm micro để nói); cuộn xuống thấy thư viện bài học.