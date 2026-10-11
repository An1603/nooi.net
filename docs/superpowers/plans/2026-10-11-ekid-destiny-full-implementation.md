# eKid v2.7 — Bản đồ số mệnh đầy đủ — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Spec:** `docs/superpowers/specs/2026-10-11-ekid-destiny-full-design.md` (chứa ĐẦY ĐỦ cấu trúc 3 result — đọc kỹ).

## Global Constraints
- Nhánh `dev`; production = `main`; KHÔNG migration. TS strict; tiếng Việt; NOOI tokens.
- KHÔNG đổi API destiny. Reuse `GET /api/ekid/kids/[kidId]/destiny`.

---

### Task 1: Khung 3 sub-tab + Thần số học đầy đủ
**Files:** `src/app/(dashboard)/app/ekid/[kidId]/DestinyTab.tsx` (tái cấu trúc), `.../[kidId]/destiny/NumerologyDetail.tsx` (mới).
- [ ] DestinyTab → header 3 sub-tab `Thần số học` | `Tử vi` | `Chiêm tinh` (state `active`, mặc định Thần số học); fetch destiny 1 lần; cảnh báo amber thiếu giờ/nơi sinh; render sub-component theo active.
- [ ] `NumerologyDetail` render ĐẦY ĐỦ: 7 core number (lifePath/destiny/soulUrge/personality/birthDay/maturity/balance) + cycles (period/pinnacle/challenge) + karmicLessons/subconsciousSelf/missingNumbers/cornerstones — mỗi field hiển thị `value`+`name`+`meaning`+`positive`/`negative`+`career`.
- [ ] tsc + test + lint sạch. Commit.

---

### Task 2: Tử vi đầy đủ
**Files:** `.../destiny/TuViDetail.tsx` (mới); nối vào DestinyTab sub-tab Tử vi.
- [ ] Render ĐẦY ĐỦ: lunarDate (âm lịch + nhuận), Tứ Trụ (năm/tháng/ngày/giờ Can Chi fullName + nghĩa can), Thân chủ, Bản Mệnh (nạp âm + hành + meaning), Cục, Cung Mệnh, Cung Thân, Đại Hạn (danh sách đủ 10), Tương sinh khắc (4 cặp), Phân tích 7 lĩnh vực (noidung + chiTiet[] + loiKhuyen), Năm hiện tại (amLich/hành/sao/hạn/meaning).
- [ ] tsc + test + lint sạch. Commit.

---

### Task 3: Chiêm tinh đầy đủ
**Files:** `.../destiny/AstrologyDetail.tsx` (mới); nối vào DestinyTab sub-tab Chiêm tinh.
- [ ] Render ĐẦY ĐỦ: Mặt Trời / Mặt Trăng / Mọc / Thiên Đỉnh (sign+degrees+meaning); danh sách planets[] (symbol+sign+house+retrograde+meaning); houses[] (12 nhà: số+sign+name+meaning); aspects[] (cặp+typeVi+harmony+meaning); dominantElement/Quality; interpretations (tongQuan/tinhCach/suNghiep/tinhDuyen/sucKhoe + diemManh[]/diemYeu[]/loiKhuyen).
- [ ] tsc + test + lint + `npm run build` PASS. Commit.

---

### Task 4: Build, deploy, verify
- [ ] `npm run build` PASS; merge `dev`→`main` + `bash deploy.sh "..."`.
- [ ] Verify: `/app/ekid` 307; destiny 401 anon; service active; nooi.net 200.
- [ ] Repo sạch, push.

## Kiểm thử (Ngài An)
Con → tab Bản đồ số mệnh → 3 sub-tab hiện đầy đủ chi tiết + luận giải từng phần.