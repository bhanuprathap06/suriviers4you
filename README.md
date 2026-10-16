# BLACKSITE: THE LAST EXTRACTION

A full-stack, browser-playable, 3D cooperative survival horror game for 4-8 players.

## Tech Stack

- **Monorepo**: npm workspaces with TypeScript strict mode
- **Server**: Colyseus v0.15 authoritative game server + Express
- **Client**: React 18 + Three.js v0.162 + React Three Fiber + Zustand
- **Database**: PostgreSQL 16 + Prisma ORM
- **Validation**: Zod runtime schemas
- **Testing**: Vitest
- **Containerization**: Docker Compose

## Project Structure

```
├── packages/shared/     # Types, constants, Zod schemas, facility layout
├── apps/server/         # Colyseus game server with systems
│   └── src/
│       ├── state/       # Colyseus schema definitions
│       ├── systems/     # Movement, AI, Combat, Inventory, Objectives
│       ├── rooms/       # GameRoom with full lifecycle
│       └── db/          # Prisma client + match persistence
├── apps/web/            # React + Three.js client
│   └── src/
│       ├── components/  # MainMenu, Lobby, Game, HUD, Results
│       ├── game/        # 3D scene, controls, audio
│       ├── network/     # Colyseus client + state sync
│       └── store/       # Zustand game state
├── prisma/              # Database schema
└── tests/               # Unit tests
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push

# Start development servers (server + client)
npm run dev
```

The game server runs on `http://localhost:2567` and the web client on `http://localhost:5173`.

### Playing

1. Open the client in your browser
2. Enter a player name and create a room
3. Share the 6-character invite code with other players
4. Once all players are ready, the host starts the mission
5. Complete all 6 objectives and reach the extraction zone to win

## Game Features

- **First-person 3D gameplay** with pointer-lock controls (WASD + mouse)
- **13-room facility** with locked doors, item spawns, and objectives
- **6-objective mission chain** with prerequisites
- **Monster AI** with patrol, chase, and attack behaviors
- **Survival systems**: health, stamina, flashlight battery, inventory
- **Downed/revive mechanics** for cooperative play
- **Private rooms** with cryptographic invite codes
- **Match history** persisted to PostgreSQL

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client in dev mode |
| `npm run build` | Build all packages |
| `npm test` | Run unit tests |
| `npm run lint` | Lint all packages |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Generate Prisma client |

## Architecture

### Server-Authoritative Design

Clients send input messages (movement, interactions). The server validates all actions, runs the 20Hz game simulation, and broadcasts state patches via Colyseus schema synchronization.

### Monster AI State Machine

`PATROL → INVESTIGATE → SEARCH → CHASE → ATTACK → RETURN`

The monster patrols waypoints, investigates noise/sightings, chases detected players, and attacks within range. Aggression scales with proximity and repeated detections.

### Networking

- WebSocket-based via Colyseus
- 20Hz server tick rate, 50ms patch rate
- Zod-validated message schemas
- Client-side prediction with server reconciliation
