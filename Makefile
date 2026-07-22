.PHONY: dev stop logs backend website db-seed db-migrate test

# Lancer l'environnement de dev complet
dev:
	docker compose up -d
	@echo "Backend API : http://localhost:8000"
	@echo "Dashboard   : http://localhost:3000"
	@echo "API Docs    : http://localhost:8000/docs"

# Arreter l'environnement
stop:
	docker compose down

# Voir les logs
logs:
	docker compose logs -f

# Logs backend uniquement
backend:
	docker compose logs -f backend

# Logs du site + dashboard (service website) uniquement
website:
	docker compose logs -f website

# Lancer les migrations Alembic
db-migrate:
	docker compose exec backend alembic upgrade head

# Generer une nouvelle migration
db-revision:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

# Seed des themes
db-seed:
	docker compose exec postgres psql -U memoria -d memoria -f /seed/seed_themes.sql

# Tests backend
test:
	docker compose exec backend pytest -v

# Reset complet de la BDD
db-reset:
	docker compose down -v
	docker compose up -d postgres
	@sleep 3
	docker compose up -d backend
	@sleep 2
	$(MAKE) db-migrate
	$(MAKE) db-seed
