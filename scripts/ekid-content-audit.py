#!/usr/bin/env python3
"""Kiểm kê nội dung eKid — chạy trước mỗi đợt mở rộng chương trình.

Trả lời đúng ba câu hỏi của người làm nội dung:
  1. Còn bao nhiêu yêu cầu cần đạt (YCCĐ) CHƯA có bài nào chạm tới?
  2. Bài nào mỏng (thiếu câu), câu nào thiếu thang gợi ý 4 bậc?
  3. Câu nào có nguy cơ chấm sai khi bé TRẢ LỜI BẰNG LỜI (đáp án số mà không có biến thể)?

Chạy: python3 scripts/ekid-content-audit.py
Đọc khoá từ .env.local (SUPABASE_URL + service role key). KHÔNG in khoá ra màn hình.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET_ITEMS_PER_LESSON = 8
TARGET_LESSONS = {"toan": 72, "tieng-viet": 72, "tnxh": 36}


def load_env() -> dict[str, str]:
    env = dict(os.environ)
    f = ROOT / ".env.local"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            t = line.strip()
            if not t or t.startswith("#") or "=" not in t:
                continue
            k, v = t.split("=", 1)
            env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


ENV = load_env()
URL = (ENV.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or ENV.get("SUPABASE_SERVICE_ROLE") or ""
if not URL or not KEY:
    sys.exit("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local")


def rest(table: str, select: str = "*", params: dict | None = None, limit: int = 1000):
    """Đọc bảng qua PostgREST, tự phân trang (Supabase chặn 1000 dòng/lần)."""
    out: list[dict] = []
    offset = 0
    while True:
        q = {"select": select, "limit": str(limit), "offset": str(offset)}
        if params:
            q.update(params)
        url = f"{URL}/rest/v1/{table}?{urllib.parse.urlencode(q)}"
        req = urllib.request.Request(url, headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req) as r:
            chunk = json.loads(r.read().decode())
        out.extend(chunk)
        if len(chunk) < limit:
            return out
        offset += limit


def subject_of(slug: str) -> str:
    if slug.startswith("toan"):
        return "toan"
    if slug.startswith("tv"):
        return "tieng-viet"
    if slug.startswith("tnxh"):
        return "tnxh"
    return "khac"


def main() -> None:
    objectives = rest("ekid_objectives", "id, grade, subject, code_short, statement")
    lessons = rest("ekid_lessons", "id, slug, title, est_minutes, objective_ids, status")
    items = rest("ekid_items", "id, lesson_id, objective_id, kind, level, prompt, answer, hint_ladder, active")

    items_by_lesson: dict[str, list[dict]] = defaultdict(list)
    for it in items:
        items_by_lesson[it["lesson_id"]].append(it)

    # ── 1. Độ phủ YCCĐ ──────────────────────────────────────────────────────
    cover: Counter[str] = Counter()
    for it in items:
        if it.get("objective_id"):
            cover[it["objective_id"]] += 1

    print("=" * 78)
    print("ĐỘ PHỦ YÊU CẦU CẦN ĐẠT")
    print("=" * 78)
    print(f"{'Môn':<12}{'YCCĐ':>6}{'Có bài':>8}{'Đủ dày(≥6 câu)':>17}{'Chưa chạm':>11}")
    by_subject: dict[str, list[dict]] = defaultdict(list)
    for o in objectives:
        by_subject[o["subject"]].append(o)
    for subj, objs in sorted(by_subject.items()):
        have = [o for o in objs if cover[o["id"]] > 0]
        thick = [o for o in objs if cover[o["id"]] >= 6]
        print(f"{subj:<12}{len(objs):>6}{len(have):>8}{len(thick):>17}{len(objs)-len(have):>11}")
    missing = [o for o in objectives if cover[o["id"]] == 0]
    if missing:
        print("\nYCCĐ CHƯA CÓ CÂU HỎI NÀO:")
        for o in missing[:40]:
            print(f"  - {o['code_short']:<14} {o['statement'][:60]}")
        if len(missing) > 40:
            print(f"  … và {len(missing) - 40} mục nữa")

    # ── 2. Bài mỏng / thiếu thang gợi ý ─────────────────────────────────────
    print("\n" + "=" * 78)
    print("CHẤT LƯỢNG BÀI")
    print("=" * 78)
    print(f"{'Bài':<42}{'Câu':>5}{'Đủ 4 bậc':>10}{'Thiếu':>7}")
    thin_lessons = 0
    bad_ladder = 0
    legacy = [l for l in lessons if not items_by_lesson.get(l["id"])]
    for les in sorted([l for l in lessons if items_by_lesson.get(l["id"])], key=lambda x: str(x.get("slug") or "")):
        its = items_by_lesson.get(les["id"], [])
        ok = 0
        for it in its:
            ladder = it.get("hint_ladder") or []
            if isinstance(ladder, list) and len(ladder) >= 4 and all(str(x).strip() for x in ladder[:4]):
                ok += 1
        bad_ladder += len(its) - ok
        if len(its) < TARGET_ITEMS_PER_LESSON:
            thin_lessons += 1
        flag = " ⚠️" if len(its) < TARGET_ITEMS_PER_LESSON else ""
        print(f"{str(les.get('slug') or les.get('title'))[:42]:<42}{len(its):>5}{ok:>10}{len(its)-ok:>7}{flag}")

    if legacy:
        print(f"\n(Ghi chú: {len(legacy)} bài cũ chưa có câu hỏi nào — không tính vào chất lượng M1.)")

    # ── 3. Rủi ro chấm sai khi bé NÓI ───────────────────────────────────────
    print("\n" + "=" * 78)
    print("RỦI RO CHẤM CÂU TRẢ LỜI NÓI")
    print("=" * 78)
    num_only = re.compile(r"^[\d\s.,]+$")
    words_num = re.compile(r"\b(không|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mươi|mười|trăm|nghìn|triệu)\b", re.I)
    # `answer-grade.ts` đã tự đổi số-viết-bằng-chữ ↔ chữ số, gom đơn vị và nhận tên chữ cái.
    # Nên rủi ro CÒN LẠI chỉ là: câu chấm theo rubric (không có đáp án đúng/sai), câu trả lời
    # dạng số thập phân/đơn vị lạ, và câu có đáp án rỗng.
    risk_rubric = 0
    risk_decimal = 0
    risk_empty = 0
    dup: Counter[str] = Counter()
    for it in items:
        a = it.get("answer") or {}
        val = str(a.get("value") or "").strip()
        dup[re.sub(r"\s+", " ", str(it.get("prompt") or "").strip().lower())] += 1
        if not val:
            risk_empty += 1
            continue
        if it.get("kind") == "giai_thich" or re.search(r"vì sao|giải thích|nói lại cách", str(it.get("prompt") or ""), re.I):
            risk_rubric += 1
        if re.search(r"\d,\d", val):
            risk_decimal += 1
    total = len(items) or 1
    print(f"Tổng câu: {len(items)}")
    print(f"  • Câu mở (chấm theo rubric, KHÔNG có đáp án đúng/sai) : {risk_rubric:>4}  ({risk_rubric*100//total}%) — cần người duyệt, không máy nào chấm được")
    print(f"  • Đáp án chứa số thập phân (dấu phẩy)              : {risk_decimal:>4}  ({risk_decimal*100//total}%) — kiểm tra lại cách bé đọc")
    print(f"  • Câu KHÔNG có đáp án                               : {risk_empty:>4}  ({risk_empty*100//total}%) — lỗi soạn, phải sửa")
    print(f"  • Câu hỏi bị TRÙNG NGUYÊN VĂN                : {sum(1 for v in dup.values() if v > 1):>4}")
    kinds = Counter(it.get("kind") for it in items)
    print(f"  • Phân bố dạng câu: {dict(kinds)}")

    # ── 4. Khoảng cách tới mốc ra mắt ───────────────────────────────────────
    print("\n" + "=" * 78)
    print("KHOẢNG CÁCH TỚI MỐC")
    print("=" * 78)
    per_subj_lessons: Counter[str] = Counter()
    per_subj_items: Counter[str] = Counter()
    for les in lessons:
        s = subject_of(str(les.get("slug") or ""))
        per_subj_lessons[s] += 1
        per_subj_items[s] += len(items_by_lesson.get(les["id"], []))
    print(f"{'Môn':<12}{'Bài hiện có':>13}{'Mốc':>7}{'Còn thiếu':>11}{'Câu hiện có':>13}{'Câu cần(thô)':>14}")
    for subj, target in TARGET_LESSONS.items():
        have = per_subj_lessons[subj]
        need_items = target * TARGET_ITEMS_PER_LESSON
        print(f"{subj:<12}{have:>13}{target:>7}{max(0, target-have):>11}{per_subj_items[subj]:>13}{need_items:>14}")

    print("\nGỢI Ý HÀNH ĐỘNG:")
    if missing:
        print(f"  1. Soạn câu cho {len(missing)} YCCĐ còn trống (ưu tiên môn đang mở bán).")
    if thin_lessons:
        print(f"  2. Bổ sung câu cho {thin_lessons} bài chưa đủ {TARGET_ITEMS_PER_LESSON} câu.")
    if bad_ladder:
        print(f"  3. Viết lại thang gợi ý cho {bad_ladder} câu thiếu bậc.")
    if risk_empty:
        print(f"  4. Sửa {risk_empty} câu thiếu đáp án.")
    if risk_rubric:
        print(f"  5. Rà tay {risk_rubric} câu mở — máy chấm đúng/sai, người chấm ý.")


if __name__ == "__main__":
    main()
