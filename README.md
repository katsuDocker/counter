To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:8080

## Run with Docker Compose

Build and start the app:

```sh
docker compose up --build
```

Open http://localhost:8080. Compose bind-mounts the workspace's `db.json` into the container at `/app/db.json`, so updates made in the app are written back to the host file and survive container recreation.

Stop the app with `Ctrl+C`, or run `docker compose down` in another terminal.
