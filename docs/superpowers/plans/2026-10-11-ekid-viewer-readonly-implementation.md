# eKid v2.8 — Quyền "Xem" chỉ-đọc — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-viewer-readonly-design.md`

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration/API. TS strict; tiếng Việt; NOOI tokens.

---

### Task 1: Ẩn hết control chỉnh sửa cho viewer
**Files:** `src/app/(dashboard)/app/ekid/[kidId]/AccountTab.tsx`, `.../[kidId]/SettingsTab.tsx`, `.../[kidId]/RelativesTab.tsx`.
- [ ] **AccountTab**: khi `!canEdit` → thay toàn bộ form bằng **bảng thông tin chỉ-đọc** (Tên, Ngày sinh, Avatar, Giờ sinh, Giới tính, Nơi sinh, Tên đăng nhập, Trạng thái, Cấp). Không Input/Select/Textarea/nút Lưu. Khi `canEdit` giữ nguyên như cũ.
- [ ] **SettingsTab**: khi `!canEdit` → thay bằng **bảng cài đặt chỉ-đọc** (text các giá trị: khung giờ học, số buổi/ngày, môn học, nguyên tắc, thưởng…). Không control/nút Lưu. Khi `canEdit` giữ nguyên.
- [ ] **RelativesTab**: ẩn khối "Nhập mã liên kết" khi `!isOwner`. Danh sách giữ nguyên.
- [ ] Rà destiny/report: không còn control chỉnh sửa cho viewer.
- [ ] tsc + test + lint + build sạch. Commit.

---

### Task 2: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify `/app/ekid` 307; service active; nooi.net 200.
- [ ] Repo sạch, push.

## Kiểm thử (Ngài An)
Vào con bằng tài khoản quyền **Xem** → mọi tab: không còn ô nhập, không nút Lưu/chỉnh sửa; chỉ hiển thị thông tin. Owner/Quản lý vẫn thấy nút như cũ.