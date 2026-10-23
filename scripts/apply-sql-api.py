#!/usr/bin/env python3
"""Chạy file .sql lên Supabase qua Management API (dùng access token của Supabase CLI).

Vì sao không dùng kết nối Postgres trực tiếp: file pooler-url của CLI không chứa
mật khẩu DB, còn service role key không dùng được cho cổng 5432.

Dùng: python3 scripts/apply-sql-api.py supabase/migrations/xxx.sql
"""
import json
import os
import subprocess
import sys

REF = "gsnuqrutiauhnsacgzym"


def run(sql: str):
    token = open(os.path.expanduser("~/.supabase/access-token")).read().strip()
    payload = json.dumps({"query": sql})
    path = "/tmp/_apply_sql_payload.json"
    with open(path, "w") as f:
        f.write(payload)
    r = subprocess.run(
        [
            "curl", "-s", "-w", "\n%{http_code}",
            "-X", "POST",
            f"https://api.supabase.com/v1/projects/{REF}/database/query",
            "-H", f"Authorization: Bearer {token}",
            "-H", "Content-Type: application/json",
            "--data-binary", f"@{path}",
        ],
        capture_output=True,
        text=True,
    )
    body, _, code = r.stdout.rpartition("\n")
    return code, body


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Thiếu đường dẫn file .sql")
        sys.exit(1)
    code, body = run(open(sys.argv[1]).read())
    print(code, body[:800])
    sys.exit(0 if code in ("200", "201") else 1)
