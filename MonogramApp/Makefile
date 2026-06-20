.PHONY: dev backend frontend test lint typecheck clean

dev:
	@cd backend && start /B python main.py && cd frontend && npm run dev

backend:
	cd backend && python main.py

frontend:
	cd frontend && npm run dev

test:
	cd backend && python -m pytest tests/ -v
	cd frontend && npx vitest run

lint:
	cd backend && ruff check .
	cd frontend && npx eslint src/

typecheck:
	cd frontend && npx tsc --noEmit

clean:
ifdef ComSpec
	if exist backend\logs rmdir /s /q backend\logs
	if exist backend\test.db del /q backend\test.db 2>nul
else
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/logs backend/test.db
endif
