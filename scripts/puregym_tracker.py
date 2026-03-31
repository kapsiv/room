#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union
from zoneinfo import ZoneInfo

if TYPE_CHECKING:
    from puregym_attendance import PuregymAPIClient


DEFAULT_DATA_DIR = Path("data/puregym")
UK_TIMEZONE = ZoneInfo("Europe/London")
OCCUPANCY_HEADER = [
    "captured_at_utc",
    "gym_id",
    "gym_requested",
    "gym_name",
    "gym_lookup_key",
    "occupancy",
    "occupancy_error",
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch PureGym live occupancy and member activity, then persist local history files."
    )
    parser.add_argument("--email", help="PureGym account email. Falls back to PUREGYM_EMAIL.")
    parser.add_argument("--pin", help="PureGym PIN. Falls back to PUREGYM_PIN.")
    parser.add_argument(
        "--gym",
        help="Optional gym name or ID. Falls back to PUREGYM_GYM. Defaults to your home gym.",
    )
    parser.add_argument(
        "--data-dir",
        default=str(DEFAULT_DATA_DIR),
        help="Directory for generated tracker files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch data without writing any files.",
    )
    parser.add_argument(
        "--print-json",
        action="store_true",
        help="Print the full snapshot JSON to stdout after fetching.",
    )
    return parser.parse_args()


def get_setting(cli_value: Optional[str], env_name: str) -> Optional[str]:
    if cli_value:
        return cli_value
    value = os.getenv(env_name)
    if value:
        return value
    return None


def parse_gym_value(value: Optional[str]) -> Optional[Union[int, str]]:
    if value is None:
        return None
    stripped = str(value).strip()
    if not stripped:
        return None
    if stripped.isdigit():
        return int(stripped)
    return stripped


def resolve_gym_reference(
    client: PuregymAPIClient, gym_value: Optional[Union[int, str]]
) -> Dict[str, Any]:
    if gym_value is None:
        home_gym = client.get_home_gym()
        return {
            "gym_id": home_gym.get("Id"),
            "gym_requested": None,
            "gym_name": home_gym.get("Name"),
            "gym_lookup_key": None,
        }

    if isinstance(gym_value, int):
        return {
            "gym_id": gym_value,
            "gym_requested": str(gym_value),
            "gym_name": None,
            "gym_lookup_key": None,
        }

    lookup_key, gym_id = client.get_gym(gym_value)
    return {
        "gym_id": gym_id,
        "gym_requested": gym_value,
        "gym_name": gym_value,
        "gym_lookup_key": lookup_key,
    }


def ensure_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def append_occupancy_history(path: Path, snapshot: Dict[str, Any]) -> None:
    ensure_directory(path.parent)
    file_exists = path.exists()
    with path.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OCCUPANCY_HEADER)
        if not file_exists:
            writer.writeheader()
        writer.writerow(
            {
                "captured_at_utc": snapshot["fetched_at_utc"],
                "gym_id": snapshot["gym"]["gym_id"],
                "gym_requested": snapshot["gym"]["gym_requested"] or "",
                "gym_name": snapshot["gym"]["gym_name"] or "",
                "gym_lookup_key": snapshot["gym"]["gym_lookup_key"] or "",
                "occupancy": snapshot.get("occupancy", ""),
                "occupancy_error": snapshot.get("occupancy_error", ""),
            }
        )


def append_jsonl(path: Path, payload: Dict[str, Any]) -> None:
    ensure_directory(path.parent)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=True))
        handle.write("\n")


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    ensure_directory(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2)
        handle.write("\n")


def parse_api_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(value)


def to_uk_local_datetime(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UK_TIMEZONE)
    return value.astimezone(UK_TIMEZONE)


def format_uk_date(value: Optional[datetime]) -> str:
    local_value = to_uk_local_datetime(value)
    if local_value is None:
        return ""
    return local_value.date().isoformat()


def format_uk_time(value: Optional[datetime]) -> str:
    local_value = to_uk_local_datetime(value)
    if local_value is None:
        return ""
    return local_value.strftime("%H:%M")


def build_visit_rows(snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
    visits = snapshot.get("member_activity", {}).get("Visits", [])
    gym_name = snapshot.get("gym", {}).get("gym_name") or ""
    gym_id = snapshot.get("gym", {}).get("gym_id") or ""
    rows = []

    for visit in visits:
        entered_at = parse_api_datetime(visit.get("StartTime"))
        duration_minutes = visit.get("Duration")
        left_at = None
        if entered_at is not None and isinstance(duration_minutes, (int, float)):
            left_at = entered_at + timedelta(minutes=duration_minutes)

        visit_gym = visit.get("Gym") or {}
        rows.append(
            {
                "date": format_uk_date(entered_at),
                "entered_at": format_uk_time(entered_at),
                "left_at": format_uk_time(left_at),
                "duration_minutes": duration_minutes if duration_minutes is not None else "",
                "is_duration_estimated": bool(visit.get("IsDurationEstimated", False)),
                "gym_id": visit_gym.get("Id") or gym_id,
                "gym_name": visit_gym.get("Name") or gym_name,
            }
        )

    return rows


def write_visit_history_csv(path: Path, snapshot: Dict[str, Any]) -> None:
    ensure_directory(path.parent)
    fieldnames = [
        "date",
        "entered_at",
        "left_at",
        "duration_minutes",
        "is_duration_estimated",
        "gym_id",
        "gym_name",
    ]
    rows = build_visit_rows(snapshot)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_snapshot(
    client: PuregymAPIClient, gym_value: Optional[Union[int, str]]
) -> Dict[str, Any]:
    fetched_at_utc = utc_now_iso()
    gym = resolve_gym_reference(client, gym_value)
    member_activity = client.get_member_activity()

    snapshot = {
        "fetched_at_utc": fetched_at_utc,
        "gym": gym,
        "member_activity": member_activity,
    }

    try:
        snapshot["occupancy"] = client.get_gym_attendance(gym["gym_id"])
        snapshot["occupancy_error"] = None
    except Exception as exc:
        snapshot["occupancy"] = None
        snapshot["occupancy_error"] = str(exc)

    return snapshot


def print_summary(snapshot: Dict[str, Any]) -> None:
    gym_id = snapshot["gym"]["gym_id"]
    gym_name = snapshot["gym"]["gym_name"] or snapshot["gym"]["gym_requested"] or f"gym {gym_id}"
    visits = snapshot.get("member_activity", {}).get("Summary", {}).get("Total", {}).get("Visits")
    summary = f"[{snapshot['fetched_at_utc']}] {gym_name} (id={gym_id}) total_visits={visits}"
    if snapshot.get("occupancy") is not None:
        summary = f"{summary} occupancy={snapshot['occupancy']}"
    print(summary)
    if snapshot.get("occupancy_error"):
        print(f"Occupancy fetch failed, but attendance data was still saved: {snapshot['occupancy_error']}")


def main() -> int:
    args = parse_args()
    email = get_setting(args.email, "PUREGYM_EMAIL")
    pin = get_setting(args.pin, "PUREGYM_PIN")
    gym_value = parse_gym_value(get_setting(args.gym, "PUREGYM_GYM"))

    if not email or not pin:
        print(
            "PUREGYM credentials are required. Set PUREGYM_EMAIL and PUREGYM_PIN or pass --email/--pin.",
            file=sys.stderr,
        )
        return 2

    try:
        from puregym_attendance import PuregymAPIClient
    except ImportError:
        print(
            "Missing dependency. Run `python3 -m pip install -r requirements-puregym.txt` first.",
            file=sys.stderr,
        )
        return 2

    try:
        client = PuregymAPIClient(email=email, pin=pin)
        snapshot = build_snapshot(client, gym_value)
    except Exception as exc:
        print(f"PureGym fetch failed: {exc}", file=sys.stderr)
        return 1

    print_summary(snapshot)

    if args.print_json:
        print(json.dumps(snapshot, ensure_ascii=True, indent=2))

    if args.dry_run:
        return 0

    data_dir = Path(args.data_dir)
    append_occupancy_history(data_dir / "occupancy_history.csv", snapshot)
    append_jsonl(data_dir / "member_activity_history.jsonl", snapshot)
    write_json(data_dir / "latest_snapshot.json", snapshot)
    write_visit_history_csv(data_dir / "visit_history.csv", snapshot)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
