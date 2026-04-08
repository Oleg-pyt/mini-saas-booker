# mini-saas

A full-stack mini SaaS monorepo with three main modules:

- `api` - OpenAPI contract (`swagger.json`) and generated Java/TypeScript clients
- `backend` - Spring Boot API and business logic
- `frontend` - Angular application

## Project Structure

- `api/` - source of truth for API contracts
- `backend/` - server-side application
- `frontend/` - client-side application
- `docker-compose.yml` - local PostgreSQL setup for development

## Requirements

- Java 25
- Maven 3.9+
- Node.js 22+
- npm 10+
- Docker (for local database)

## Quick Start (Local)

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Generate and build API artifacts (OpenAPI Java + TypeScript package):

```bash
mvn -pl api -am package
```

3. Run backend:

```bash
mvn -pl backend -am spring-boot:run
```

4. Refresh frontend API package and run frontend:

```bash
cd frontend
npm install .generated/api.tgz --no-save
npm start
```

Frontend usually runs at `http://localhost:4200`, backend at `http://localhost:8080`.

## Useful Commands

Compile backend:

```bash
mvn -pl backend -am -DskipTests compile
```

Build frontend (production):

```bash
cd frontend
npm run build
```

Build frontend (development):

```bash
cd frontend
npm run build -- --configuration development
```

## Swagger-First Workflow

Main API contract: `api/swagger.json`.

When adding or changing endpoints/DTOs, update Swagger first, then regenerate clients/models via Maven.
