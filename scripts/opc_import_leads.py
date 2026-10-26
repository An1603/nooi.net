#!/usr/bin/env python3
"""Nhập lead từ CSV vào OPC Center (Supabase REST, service role).

Cột CSV bắt buộc: ten
Cột tùy chọn: sdt,email,nguon,kenh,trang_thai,diem,ghi_chu,chu_so_huu_email

Ví dụ:
  python3 scripts/opc_import_leads.py --file leads.csv --dry-run
  python3 scripts/opc_import_leads.py --file leads.csv
"""
import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request

TRANG_THAI = {"lead", "mql", "sql", "customer", "active", "at_risk", "churned"}


def load_env():
    paths = [os.path.expanduser("~/nooi.net/.env.local"), ".env.local"]
    for path in paths:
        if not os.path.exists(path):
            continue
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            if k not in os.environ:
                os.environ[k] = v.strip().strip('"').strip("'")


def api(method, path, data=None, prefer=None):
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(
        url,
        method=method,
        data=json.dumps(data, ensure_ascii=False).encode() if data is not None else None,
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read().decode()
            return r.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    load_env()
    if not os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        sys.exit("Thiếu SUPABASE_SERVICE_ROLE_KEY")

    status, rows = api("GET", "opc_nguoi?select=id,email&limit=5000")
    if status != 200 or not isinstance(rows, list):
        sys.exit(f"Không đọc được opc_nguoi: {status} {rows}")
    nguoi_theo_email = {
        (r.get("email") or "").lower(): r["id"] for r in rows if r.get("email")
    }

    leads = []
    loi = []
    with open(args.file, encoding="utf-8-sig", newline="") as f:
        for i, row in enumerate(csv.DictReader(f), start=2):
            ten = (row.get("ten") or "").strip()
            if not ten:
                loi.append(f"Dòng {i}: thiếu ten")
                continue
            trang_thai = (row.get("trang_thai") or "lead").strip()
            if trang_thai not in TRANG_THAI:
                loi.append(f"Dòng {i}: trang_thai '{trang_thai}' không hợp lệ")
                continue
            try:
                diem = int((row.get("diem") or "0").strip() or 0)
            except ValueError:
                diem = 0
            owner_email = (row.get("chu_so_huu_email") or "").strip().lower()
            leads.append(
                {
                    "ten": ten,
                    "sdt": (row.get("sdt") or "").strip() or None,
                    "email": (row.get("email") or "").strip() or None,
                    "nguon": (row.get("nguon") or "").strip() or None,
                    "kenh": (row.get("kenh") or "").strip() or None,
                    "trang_thai": trang_thai,
                    "diem": max(0, min(100, diem)),
                    "ghi_chu": (row.get("ghi_chu") or "").strip() or None,
                    "chu_so_huu": nguoi_theo_email.get(owner_email) if owner_email else None,
                }
            )
            if owner_email and not leads[-1]["chu_so_huu"]:
                loi.append(f"Dòng {i}: không tìm thấy chủ sở hữu {owner_email} — để trống")

    print(f"Đọc {len(leads)} lead hợp lệ, {len(loi)} cảnh báo.")
    for x in loi[:20]:
        print("  !", x)

    if args.dry_run:
        for x in leads[:5]:
            print("  ·", x["ten"], x["trang_thai"], x["chu_so_huu"] or "chưa gán")
        print("Dry-run: không ghi dữ liệu.")
        return

    if not leads:
        return

    status, created = api(
        "POST",
        "opc_lead",
        leads,
        prefer="return=representation",
    )
    if status not in (200, 201) or not isinstance(created, list):
        sys.exit(f"Ghi lead lỗi: {status} {created}")
    hoat_dong = [
        {
            "lead_id": r["id"],
            "loai": "he_thong",
            "noi_dung": f"Nhập từ CSV: {os.path.basename(args.file)}",
        }
        for r in created
    ]
    if hoat_dong:
        api("POST", "opc_hoat_dong", hoat_dong, prefer="return=minimal")

    print(f"Đã nhập {len(created)} lead.")


if __name__ == "__main__":
    main()
