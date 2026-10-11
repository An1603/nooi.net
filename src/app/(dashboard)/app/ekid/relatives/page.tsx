import { redirect } from "next/navigation";

// Trang "Người thân" rời đã gộp vào console mỗi con (/app/ekid/[kidId] → tab Người thân).
// Giữ route để link/bookmark cũ không bị 404.
export default function Page() {
  redirect("/app/ekid");
}
