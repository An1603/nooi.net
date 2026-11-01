/**
 * Chỉ người có trong `admin_users` mới được duyệt nội dung.
 *
 * Middleware đã chặn TRANG /admin theo host admin.nooi.net, nhưng route /api/admin/*
 * không đi qua bước kiểm đó — nên mọi API quản trị phải tự kiểm.
 *
 * Từ 01/11/2026 hiện thực duy nhất nằm ở `@/lib/admin/guard` (dùng chung cho cả
 * API admin và eKid) để hai nhánh không bị lệch logic phân quyền.
 */
export { requireAdmin } from "@/lib/admin/guard";
