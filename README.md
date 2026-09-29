# Counter

A small Bun and Hono app for tracking progress toward a target. The dashboard shows the current total, completion percentage, days remaining, daily amount needed, today's progress, and recent updates.

## Requirements

- [Bun](https://bun.sh/) for local development
- Docker with the Compose plugin for containerized development

## Local development

Install dependencies and start the hot-reloading development server:

```sh
bun install
bun run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Docker Compose

Build and start the app:

```sh
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The Compose configuration bind-mounts the host `db.sqlite` to `/app/db.sqlite`, so updates persist when the container is restarted or recreated.

Stop the app with `Ctrl+C`, or run:

```sh
docker compose down
```

## Pages

- `GET /` - progress dashboard
- `GET /history` - update history and goal settings
- `GET /goals` - alias for the history and goal settings page

## API

All request bodies must be JSON. Successful write requests return the updated database state from `db.sqlite`.

### Read progress

```http
GET /api/daily
```

Returns the current goal, total, deadline, and update history.

### Update the goal

```http
POST /api/goals
Content-Type: application/json

{
	"head_target": 500000,
	"day_end": 1791223200
}
```

`head_target` must be a non-negative number. `day_end` must be a positive Unix timestamp in seconds.

### Save a progress update

```http
POST /api/updates
Content-Type: application/json

{
	"id": "2026-09-26T12:00:00.000Z",
	"current": 150000
}
```

`current` is the new overall total, not an increment. It must be a non-negative whole number. `id` identifies the update and is typically an ISO 8601 timestamp.

## Data storage

Progress is stored in `db.sqlite` at the project root. The database keeps the target, current total, deadline, saved updates, and a `goal_log` table that records each time the target/deadline is changed.

If a legacy `db.json` file is present, the app migrates it into SQLite on first run and then keeps using the SQLite database.
