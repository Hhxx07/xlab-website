# XLab

Notion-style personal homepage plus a 3D voxel town entrance for notes, posts, and personal content.

The current frontend MVP includes:

- Public homepage at `/`
- Fullscreen 3D voxel town at `/world`
- Markdown note pages at `/notes/*`
- Six content modules: knowledge, game, life, movie, novel, sport
- WASD / arrow-key player movement
- `E` interaction prompts and Markdown-style modal notes
- Login kept only for actions such as commenting, liking, writing, and admin work

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| 3D | three, @react-three/fiber, @react-three/drei |
| Styling | Tailwind CSS |
| State | Zustand |
| Routing | React Router |
| Backend | Go 1.25, chi |
| Database | PostgreSQL 18 |
| Cache / Queue | Redis 8 |
| Dev Env | Docker Compose |

## Project Structure

```text
.
├─ design.md
├─ docker-compose.yml
├─ README.md
├─ frontend/
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ src/
│     ├─ App.tsx
│     ├─ pages/
│     │  ├─ HomePage.tsx
│     │  ├─ WorldPage.tsx
│     │  ├─ NotePage.tsx
│     │  ├─ LoginPage.tsx
│     │  ├─ RegisterPage.tsx
│     │  └─ ProfilePage.tsx
│     ├─ features/world/
│     │  ├─ WorldCanvas.tsx
│     │  ├─ WorldScene.tsx
│     │  ├─ Player.tsx
│     │  ├─ CameraRig.tsx
│     │  ├─ components/
│     │  ├─ modules/
│     │  ├─ controls/
│     │  ├─ data/
│     │  ├─ store/
│     │  └─ utils/
│     └─ content/notes/
└─ backend/
   ├─ Dockerfile
   ├─ cmd/
   ├─ internal/
   └─ migrations/
```

## Quick Start

### Option 1: Full Docker Development

Use this when you want frontend, backend, PostgreSQL, and Redis running together.

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- 3D world: http://localhost:5173/world
- API health: http://localhost:8080/api/health
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Useful commands:

```bash
docker compose logs -f frontend
docker compose logs -f api
docker compose down
```

If dependencies changed, rebuild the frontend container:

```bash
docker compose build frontend
docker compose up frontend
```

### Option 2: Docker Databases + Local Frontend / Backend

Use this for the fastest frontend debugging loop.

Terminal 1:

```bash
docker compose up -d postgres redis
```

Terminal 2, backend:

```bash
cd backend
go run ./cmd/api
```

Terminal 3, frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

- http://localhost:5173
- http://localhost:5173/world
- http://localhost:5173/notes/knowledge/math

### Option 3: Frontend Only

Use this when you only need the homepage and 3D prototype. Auth API calls may fail until the backend is running, but public routes and the 3D world still load.

```bash
cd frontend
npm install
npm run dev
```

## Debugging Notes

### Vite inside Docker

The frontend container listens on `0.0.0.0:5173`. Docker Compose also enables polling:

```yaml
CHOKIDAR_USEPOLLING: "true"
WATCHPACK_POLLING: "true"
```

This makes hot reload more reliable on Windows bind mounts.

### PostgreSQL 18 Volume Layout

PostgreSQL 18 Docker images expect the volume to be mounted at:

```text
/var/lib/postgresql
```

This project uses the `postgres18_data` volume for that reason. If you previously ran an older compose file that mounted `/var/lib/postgresql/data`, recreate the containers after pulling this change:

```bash
docker compose down
docker compose up --build
```

If you intentionally need to reset local development data, remove the volume as well:

```bash
docker compose down -v
```

### API Proxy

Vite proxies `/api` to:

```text
VITE_API_BASE_URL=http://api:8080
```

When running frontend locally outside Docker, the fallback target in `vite.config.ts` is still `http://api:8080`; if you need local API proxying, start Vite like this:

```bash
cd frontend
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

PowerShell syntax is shown above. In bash:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

### 3D World Controls

On `/world`:

- `WASD` / arrow keys: move
- `E`: interact with the nearest hotspot
- `Esc`: close modal; if no modal is open, return to homepage
- `Enter`: open the current note as a full page when the modal is open

## Validation

Frontend build:

```bash
cd frontend
npm run build
```

Backend build:

```bash
cd backend
go build ./...
```

Full Docker smoke test:

```bash
docker compose up --build
```

Then verify:

```bash
curl http://localhost:8080/api/health
```

## Adding a New House

1. Add a module entry in `frontend/src/features/world/data/worldModules.ts`.
2. Create a new component under `frontend/src/features/world/modules/`.
3. Register the component in `moduleComponents` inside `WorldScene.tsx`.
4. Add one or more hotspots in `frontend/src/features/world/data/hotspots.ts`.
5. Add Markdown content under `frontend/src/content/notes/`.
6. Register the Markdown file in `frontend/src/content/notes/noteRegistry.ts`.

## Replacing Geometry with GLB Models

Each house is isolated in its own component, for example:

```text
frontend/src/features/world/modules/KnowledgeHouse.tsx
```

To replace a procedural house:

1. Put the model under `frontend/public/models/knowledge-house.glb`.
2. Use `useGLTF('/models/knowledge-house.glb')` inside the house component.
3. Keep the outer `<group position={position}>`.
4. Keep `HouseLabel` or replace it with a better label.
5. Do not move hotspot coordinates unless the model footprint changes.

The interaction system is data-driven, so replacing visuals should not require changing modal or keyboard logic.

## Common Commands

```bash
# Frontend
cd frontend
npm install
npm run dev
npm run build

# Backend
cd backend
go run ./cmd/api
go build ./...

# Docker
docker compose up --build
docker compose logs -f frontend
docker compose logs -f api
docker compose down
```

## Current MVP Routes

| Route | Description |
| --- | --- |
| `/` | Notion-style personal homepage with 3D world preview |
| `/world` | Fullscreen interactive 3D voxel town |
| `/notes/knowledge/math` | Example Markdown note page |
| `/login` | Login |
| `/register` | Register |
| `/profile` | Profile page |

## License

MIT
