#!/usr/bin/env python3
"""Generate the fake screenshots used by the privacy-first demo.

Run from this directory:

    python3 make_sample.py

It writes three PNGs, their box JSON files and `samples.js`:

    sample.png           -> API 401 (.env)
    sample-support.png   -> Support ticket
    sample-bank.png      -> Bank statement
    samples.js           -> MOCK_SAMPLES consumed by redaction.js

Every value is fake. The normalized boxes in `samples.js` are what the mock mode
draws when Gemini Nano is not available.
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
W, H = 1600, 900
BG = "#0b1220"
PANEL = "#0f172a"
BAR = "#1e293b"
EDITOR = "#0b1220"
TERMINAL = "#020617"
LINE = "#1e293b"
TEXT = "#e2e8f0"
MUTED = "#64748b"
KEY = "#93c5fd"
GREEN = "#22c55e"
AMBER = "#fbbf24"

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def rounded(draw, box, radius, fill, outline=None):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=1)


def seg(text, color=TEXT, kind=None):
    return (text, color, kind)


SAMPLES = {
    "sample.png": {
        "label": "API 401 (.env)",
        "title": "payments-service — Visual Studio Code",
        "tab": "payments.env",
        "tree": [
            ("payments-service", 0),
            (".env", 1),
            ("docker-compose.yml", 1),
            ("src/", 1),
            ("charge.ts", 2),
            ("refund.ts", 2),
            ("README.md", 1),
        ],
        "status_left": "main*   UTF-8   LF   TypeScript   Firebase AI Logic",
        "status_right": "Ln 4, Col 1   Spaces: 2",
        "editor_size": 22,
        "terminal_size": 16,
        "editor": [
            [seg("# payments-service/.env — local development", MUTED)],
            [seg("STRIPE_SECRET_KEY=", KEY), seg("sk_demo_51NxFAKE1234567890abcdef", TEXT, "API key")],
            [seg("OPENAI_API_KEY=", KEY), seg("sk-proj-FAKE1234567890abcdefghijklmnop", TEXT, "API key")],
            [seg("DATABASE_URL=", KEY), seg("postgres://admin:hunter2@db.internal:5432/payments", TEXT, "database URL")],
            [seg("SUPPORT_EMAIL=", KEY), seg("ana.garcia@example.com", TEXT, "email")],
            [seg("CUSTOMER_IBAN=", KEY), seg("ES91 2100 0418 4502 0005 1332", TEXT, "IBAN")],
            [seg("CARD_NUMBER=", KEY), seg("4111 1111 1111 1111", TEXT, "credit card")],
            [seg("PHONE=", KEY), seg("+34 612 345 678", TEXT, "phone")],
            [seg("GITHUB_TOKEN=", KEY), seg("ghp_FAKE1234567890abcdefghijklmn", TEXT, "GitHub token")],
            [seg("AWS_ACCESS_KEY_ID=", KEY), seg("AKIAIOSFODNN7EXAMPLE", TEXT, "AWS access key")],
            [],
            [seg("# TODO: rotate these credentials before the demo.", MUTED)],
            [seg("# Never commit this file to git.", MUTED)],
            [],
            [seg("# Owner: ", MUTED), seg("Ana García", TEXT, "name"), seg(" <", MUTED), seg("ana.garcia@example.com", TEXT, "email"), seg(">", MUTED)],
        ],
        "terminal": [
            [seg('$ curl -H "Authorization: Bearer \\', GREEN)],
            [seg("    ", MUTED), seg("eyJhbGciOiJIUzI1NiJ9.FAKE.signature", TEXT, "JWT"), seg('" \\', MUTED)],
            [seg("    https://api.payments.example.com/v1/charge", MUTED)],
            [seg("HTTP/1.1 401 Unauthorized", AMBER)],
            [seg('{"error":"invalid_api_key"}', MUTED)],
            [],
            [seg("$ whoami", GREEN)],
            [seg("Ana García", TEXT, "name"), seg(" <", MUTED), seg("ana.garcia@example.com", TEXT, "email"), seg(">", MUTED)],
            [],
            [seg("$ git remote -v", GREEN)],
            [seg("origin  https://github.com/ana-garcia/payments.git", MUTED)],
            [],
            [seg("# 401: rotate the key and check the vault.", MUTED)],
        ],
    },
    "sample-support.png": {
        "label": "Support ticket",
        "title": "Support ticket #4821 — Zendesk",
        "tab": "ticket-4821.txt",
        "tree": [
            ("support", 0),
            ("tickets/", 1),
            ("4821.txt", 2),
            ("macros/", 1),
            ("refund.md", 2),
            ("README.md", 1),
        ],
        "status_left": "support*   UTF-8   LF   Markdown   Zendesk",
        "status_right": "Ln 7, Col 1   Spaces: 2",
        "editor_size": 20,
        "terminal_size": 15,
        "editor": [
            [seg("# Ticket #4821 — customer report", MUTED)],
            [seg("Customer: ", KEY), seg("Ana García", TEXT, "name")],
            [seg("Email: ", KEY), seg("ana.garcia@example.com", TEXT, "email")],
            [seg("Phone: ", KEY), seg("+34 612 345 678", TEXT, "phone")],
            [seg("Address: ", KEY), seg("Calle Mayor 12, 33201 Gijón", TEXT, "address")],
            [seg("Order: ", KEY), seg("ORD-2026-4821", TEXT, "order ID")],
            [seg("Card: ", KEY), seg("4111 1111 1111 1111", TEXT, "credit card")],
            [seg("Message: ", KEY), seg("My order never arrived.", TEXT)],
            [],
            [seg("API key: ", KEY), seg("sk_demo_51NxFAKE1234567890abcdef", TEXT, "API key")],
            [seg("Tracking: ", KEY), seg("1Z999AA10123456784", TEXT, "tracking number")],
            [],
            [seg("# Internal note: customer is on the VIP list.", MUTED)],
            [seg("# Do not share this ticket outside support.", MUTED)],
            [],
            [seg("Owner: ", KEY), seg("Ana García", TEXT, "name")],
        ],
        "terminal": [
            [seg("$ curl -X POST \\", GREEN)],
            [seg("    https://api.support.example.com/tickets/4821 \\", MUTED)],
            [seg('    -H "Authorization: Bearer \\', MUTED)],
            [seg("    ", MUTED), seg("eyJhbGciOiJIUzI1NiJ9.FAKE.signature", TEXT, "JWT"), seg('"', MUTED)],
            [seg("HTTP/1.1 200 OK", AMBER)],
            [seg('{"status":"open","priority":"high"}', MUTED)],
        ],
    },
    "sample-bank.png": {
        "label": "Bank statement",
        "title": "Bank statement — March 2026",
        "tab": "statement-2026-03.csv",
        "tree": [
            ("finance", 0),
            ("statements/", 1),
            ("2026-03.csv", 2),
            ("cards/", 1),
            ("personal.md", 2),
            ("README.md", 1),
        ],
        "status_left": "finance*   UTF-8   LF   CSV   Banking",
        "status_right": "Ln 4, Col 1   Spaces: 2",
        "editor_size": 20,
        "terminal_size": 15,
        "editor": [
            [seg("# Bank statement — March 2026", MUTED)],
            [seg("Account holder: ", KEY), seg("Ana García", TEXT, "name")],
            [seg("IBAN: ", KEY), seg("ES91 2100 0418 4502 0005 1332", TEXT, "IBAN")],
            [seg("Card: ", KEY), seg("4111 1111 1111 1111", TEXT, "credit card")],
            [seg("Balance: ", KEY), seg("12,480.55 EUR", TEXT)],
            [seg("Email: ", KEY), seg("ana.garcia@example.com", TEXT, "email")],
            [seg("Phone: ", KEY), seg("+34 612 345 678", TEXT, "phone")],
            [seg("Address: ", KEY), seg("Calle Mayor 12, 33201 Gijón", TEXT, "address")],
            [],
            [seg("Transactions:", MUTED)],
            [seg("  2026-03-01  Salary      +2,400.00", TEXT)],
            [seg("  2026-03-03  Rent        -950.00", TEXT)],
            [seg("  2026-03-05  Groceries   -82.40", TEXT)],
            [],
            [seg("# Owner: ", MUTED), seg("Ana García", TEXT, "name")],
        ],
        "terminal": [
            [seg('$ curl -H "Authorization: Bearer \\', GREEN)],
            [seg("    ", MUTED), seg("eyJhbGciOiJIUzI1NiJ9.FAKE.signature", TEXT, "JWT"), seg('" \\', MUTED)],
            [seg("    https://api.bank.example.com/v1/accounts", MUTED)],
            [seg("HTTP/1.1 200 OK", AMBER)],
            [seg('{"balance":12480.55,"currency":"EUR"}', MUTED)],
        ],
    },
}


def add_box(boxes, value, kind, x, y, w, h):
    boxes.append(
        {
            "value": value,
            "type": kind,
            "x": round(max(0.0, x / W), 5),
            "y": round(max(0.0, y / H), 5),
            "w": round(min(1.0, w / W), 5),
            "h": round(min(1.0, h / H), 5),
        }
    )


def draw_segments(draw, segments, x, y, size, boxes):
    f = font(MONO, size)
    cx = x
    for text, color, kind in segments:
        if not text:
            continue
        draw.text((cx, y), text, font=f, fill=color)
        if kind:
            add_box(boxes, text, kind, cx, y - 2, f.getlength(text), size + 6)
        cx += f.getlength(text)


def render(name, sample):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    rounded(draw, (20, 20, W - 20, H - 20), 18, PANEL, LINE)
    draw.rectangle((20, 20, W - 20, 72), fill=BAR)
    draw.rectangle((20, 72, 260, H - 20), fill=EDITOR)
    draw.rectangle((260, 72, 1050, H - 20), fill=EDITOR)
    draw.rectangle((260, 72, 1050, 104), fill="#111827")
    draw.rectangle((260, 72, 460, 104), fill=EDITOR)
    draw.rectangle((1050, 72, W - 20, H - 20), fill=TERMINAL)
    draw.rectangle((1050, 72, W - 20, 108), fill="#111827")
    draw.rectangle((20, H - 44, W - 20, H - 20), fill=BAR)

    for i, color in enumerate(("#f87171", "#fbbf24", "#22c55e")):
        cx = 48 + i * 26
        draw.ellipse((cx - 7, 39, cx + 7, 53), fill=color)

    draw.text(
        (W // 2, 46),
        sample["title"],
        font=font(SANS_BOLD, 18),
        fill=TEXT,
        anchor="mm",
    )

    sidebar_font = font(MONO, 17)
    draw.text((40, 96), "EXPLORER", font=font(MONO_BOLD, 14), fill=MUTED)
    for i, (item, depth) in enumerate(sample["tree"]):
        y = 138 + i * 28
        x = 40 + depth * 18
        if item.endswith(".env") or item.endswith(".txt") or item.endswith(".csv"):
            draw.rectangle((32, y - 5, 250, y + 22), fill="#1e3a5f")
        draw.text((x, y), item, font=sidebar_font, fill=TEXT if depth < 2 else MUTED)

    tab_font = font(MONO, 16)
    draw.text((280, 88), sample["tab"], font=tab_font, fill=TEXT)
    draw.text((280 + tab_font.getlength(sample["tab"]) + 10, 86), "×", font=tab_font, fill=MUTED)

    term_header = font(MONO_BOLD, 13)
    draw.text((1070, 90), "TERMINAL", font=term_header, fill=MUTED)
    draw.text((1500, 90), "bash", font=font(MONO, 13), fill=GREEN)

    status_font = font(MONO, 13)
    draw.text((40, H - 32), sample["status_left"], font=status_font, fill=TEXT)
    draw.text((W - 250, H - 32), sample["status_right"], font=status_font, fill=MUTED)

    boxes = []
    x_num, x_text, y0, lh = 286, 342, 150, 36
    editor_size = sample["editor_size"]
    for i, segments in enumerate(sample["editor"], start=1):
        y = y0 + (i - 1) * lh
        draw.text((x_num, y), str(i), font=font(MONO, 18), fill="#475569")
        if segments:
            draw_segments(draw, segments, x_text, y, editor_size, boxes)

    tx, ty0, tlh = 1070, 150, 34
    term_size = sample["terminal_size"]
    for i, segments in enumerate(sample["terminal"]):
        y = ty0 + i * tlh
        if segments:
            draw_segments(draw, segments, tx, y, term_size, boxes)

    img.save(HERE / name, optimize=True)

    text_lines = ["".join(part[0] for part in line) for line in sample["editor"]]
    term_lines = ["".join(part[0] for part in line) for line in sample["terminal"]]
    text = "\n".join(text_lines) + "\n\n" + "\n".join(term_lines)

    payload = {
        "image": name,
        "width": W,
        "height": H,
        "label": sample["label"],
        "boxes": boxes,
    }
    stem = Path(name).stem
    (HERE / f"{stem}-boxes.json").write_text(json.dumps(payload, indent=2) + "\n")

    return {
        "label": sample["label"],
        "text": text,
        "boxes": boxes,
    }


def main():
    samples = {}
    for name, sample in SAMPLES.items():
        samples[name] = render(name, sample)

    js = (
        "// Generated by make_sample.py. Do not edit by hand.\n"
        "export const MOCK_SAMPLES = "
        + json.dumps(samples, ensure_ascii=False, indent=2)
        + ";\n"
    )
    (HERE / "samples.js").write_text(js)

    (HERE / "sample-boxes.json").write_text(
        json.dumps(
            {
                "image": "sample.png",
                "width": W,
                "height": H,
                "boxes": samples["sample.png"]["boxes"],
            },
            indent=2,
        )
        + "\n"
    )
    print("Generated:", ", ".join(samples))


if __name__ == "__main__":
    main()
