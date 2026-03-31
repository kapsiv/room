# KAPSIV.COM (my website)

<img width="4096" height="4096" alt="kapsiv-room-4K" src="https://github.com/user-attachments/assets/b9652ae9-efc8-43cd-b71e-6f288b43d797" />

## Utilities

### PureGym tracker

`scripts/puregym_tracker.py` uses the upstream [`puregym_attendance`](https://github.com/2t6h/puregym-attendance) client to fetch:

- live gym occupancy via `get_gym_attendance()`
- your account activity payload via `get_member_activity()`

Setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-puregym.txt

export PUREGYM_EMAIL="you@example.com"
export PUREGYM_PIN="1234"
# optional: use a specific gym name or ID instead of your PureGym home gym
export PUREGYM_GYM="London Finsbury Park"

python3 scripts/puregym_tracker.py
```

The script writes local-only files under `data/puregym/`:

- `occupancy_history.csv`
- `member_activity_history.jsonl`
- `latest_snapshot.json`
- `visit_history.csv`

Useful flags:

```bash
# fetch only, don't write files
python3 scripts/puregym_tracker.py --dry-run --print-json

# store generated files somewhere else
python3 scripts/puregym_tracker.py --data-dir /tmp/puregym
```

Example cron entry:

```bash
0 * * * * cd /Users/kaps/Documents/Projects/Kaps\'\ Coding\ Files/Room/room-portfolio && /Users/kaps/Documents/Projects/Kaps\'\ Coding\ Files/Room/room-portfolio/.venv/bin/python scripts/puregym_tracker.py >> /tmp/puregym-tracker.log 2>&1
```

### Vercel Blob ingest

There is also a server-side ingest route at `/api/puregym-ingest` that appends new visits into a Blob CSV at `activ/visit_history.csv` by default.

Set these Vercel environment variables:

```bash
PUREGYM_EMAIL=...
PUREGYM_PIN=...
CRON_SECRET=...
PUREGYM_VISITS_BLOB_PATH=activ/visit_history.csv
PUREGYM_VISITS_BLOB_ACCESS=private
```

`vercel.json` schedules the route once per day at `0 1 * * *` UTC.

- On March 31, 2026 that is 2:00 AM in the UK because the UK is on BST (UTC+1).
- After the clocks go back on October 25, 2026, the same cron runs at 1:00 AM UK time.

Vercel cron is UTC-only, so one expression cannot stay pinned to the same UK local hour year-round.
