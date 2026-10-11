import { redirect } from "next/navigation";

// Trang "Tiến độ" rời đã gộp vào console mỗi con (/app/ekid/[kidId] → tab Báo cáo).
// Giữ route để link/bookmark cũ không bị 404.
export default function Page() {
  redirect("/app/ekid");
}
