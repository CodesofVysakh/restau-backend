# NestJS Backend

## Quick start (Docker — full stack)

```bash
# From ember-platform/ root
cp .env.example .env
docker-compose up --build
```

| Service | URL |
|---|---|
| Customer app | http://localhost:3000 |
| Kitchen dashboard | http://localhost:3000/kitchen/dashboard |
| REST API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |

Default admin: `admin` / `ember2024!`

---

## Local development

```bash
cd ember-api
npm install
cp .env.example .env          # fill in DB + Redis credentials
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
npm run start:dev
```

## Tests

```bash
npm test              # unit tests
npm run test:cov      # with coverage
npm run test:e2e      # integration tests (needs live DB + Redis)
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | — |
| `JWT_SECRET` | JWT signing secret (≥32 chars) | — |
| `JWT_EXPIRES_IN` | Token lifetime | `8h` |
| `PORT` | API port | `3001` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `CART_TTL_SECONDS` | Cart session TTL | `86400` |
| `TAX_RATE` | Tax rate decimal | `0.08` |

## Architecture

```
Controller → Service → Repository → PostgreSQL
                     → RedisService → Redis
                     → PaymentService (mock)
                     → OrderEventEmitter → Socket.io
```

### Order status FSM
```
RECEIVED → PREPARING → READY → COMPLETED
```
Backward transitions and skips return `400 Bad Request`.

### Concurrent stock guard
`SELECT … FOR UPDATE` inside a `prisma.$transaction()`. Two simultaneous
orders competing for the last item — exactly one succeeds (201), one
returns `409 Conflict`.

### Mock payment
- Any card except `0000` → success
- Card `0000` → declined (`400`)

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Admin login → JWT |
| GET | `/api/menu/categories` | — | All categories |
| GET | `/api/menu/items` | — | Items (search, category, dietary, price) |
| GET | `/api/menu/items/:id` | — | Item detail with customizations |
| GET | `/api/cart/:sessionId` | — | Cart + stale price check |
| POST | `/api/cart/:sessionId/table` | — | Set table number |
| POST | `/api/cart/:sessionId/items` | — | Add item |
| PATCH | `/api/cart/:sessionId/items/:id` | — | Update qty / instructions |
| DELETE | `/api/cart/:sessionId/items/:id` | — | Remove item |
| DELETE | `/api/cart/:sessionId` | — | Clear cart |
| POST | `/api/orders` | — | Place order |
| GET | `/api/orders` | JWT | All orders (kitchen) |
| GET | `/api/orders/:id` | — | Order detail |
| GET | `/api/orders/session/:sid` | — | Orders by session |
| PATCH | `/api/orders/:id/status` | JWT | Update status |

## WebSocket events

Connect to `ws://localhost:3001`

| Event | Direction | Payload |
|---|---|---|
| `join:order` | client → server | `{ orderId }` |
| `join:kitchen` | client → server | `{ token }` |
| `order:new` | server → kitchen | `{ order }` |
| `order:status` | server → all | `{ orderId, status, tableNumber, timestamp }` |
