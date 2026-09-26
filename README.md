# Counter

A small Bun and Hono app for tracking progress toward a target. The dashboard shows the current total, goal completion, days remaining, the daily amount needed to reach the target, today's progress, and recent updates. Use the form to save a new overall total.

## Local development

Requirements: [Bun](https://bun.sh/).

Install dependencies:

```sh
bun install
```

Start the development server:

```sh
bun run dev
```

Open http://localhost:8080.

Progress is stored in `db.json` in the project root.

## Docker Compose

Requirements: Docker with the Compose plugin.

Build the image and start the app:

```sh
docker compose up --build
```

Open http://localhost:8080. Compose maps the host's `db.json` to `/app/db.json` in the container. Updates are written directly to the host file and survive container restarts or recreation.

Stop the app with `Ctrl+C` when running in the foreground, or use:

```sh
docker compose down
```

## API

- `GET /api/daily` — read the current target, total, deadline, and update history.
- `POST /api/updates` — save an update as JSON, for example `{"id":"2026-09-26T12:00:00.000Z","current":150000}`. `current` is the new overall total (not an increment).

## Run with Docker Compose

Build and start the app:

```sh
docker compose up --build
```

Open http://localhost:8080. Compose bind-mounts the workspace's `db.json` into the container at `/app/db.json`, so updates made in the app are written back to the host file and survive container recreation.

Stop the app with `Ctrl+C`, or run `docker compose down` in another terminal.
