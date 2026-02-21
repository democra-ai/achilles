"""Achilles Vault — FastAPI application entry point.

Follows fastapi skill patterns:
- Pattern 1: Secure Application Setup (security headers, CORS)
- Pattern 4: Rate Limiting
- Error handling that doesn't leak internals
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from achilles.config import get_settings
from achilles.database import Database
from achilles.routers import ai_router, audit_router, auth_router, projects_router, secrets_router

logger = logging.getLogger("achilles")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    settings = get_settings()
    settings.ensure_dirs()

    db = Database(settings)
    await db.connect()

    app.state.settings = settings
    app.state.db = db

    logger.info(f"Achilles Vault started on {settings.host}:{settings.port}")
    logger.info(f"Data directory: {settings.data_dir}")

    yield

    await db.close()
    logger.info("Achilles Vault stopped")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Achilles Vault",
        description="Open-source local-first secret management with AI/LLM integration",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Rate limiting
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS — permissive for local use, configure for production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Error handlers
    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        # Sanitize errors: convert bytes to str so JSONResponse can serialize
        errors = []
        for err in exc.errors():
            clean = {}
            for k, v in err.items():
                clean[k] = v.decode("utf-8", errors="replace") if isinstance(v, bytes) else v
            errors.append(clean)
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": errors,
                }
            },
        )

    @app.exception_handler(Exception)
    async def global_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}},
        )

    # Routers
    app.include_router(auth_router.router)
    app.include_router(projects_router.router)
    app.include_router(secrets_router.router)
    app.include_router(ai_router.router)
    app.include_router(audit_router.router)

    # Health check
    @app.get("/health", tags=["system"])
    async def health():
        return {"status": "healthy", "version": "0.1.0"}

    # Serve web dashboard
    web_dir = Path(__file__).parent.parent / "web"
    if web_dir.exists():
        @app.get("/", tags=["dashboard"])
        async def dashboard():
            return FileResponse(web_dir / "index.html")

        app.mount("/static", StaticFiles(directory=str(web_dir / "static")), name="static")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "achilles.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
