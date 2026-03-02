from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
from app.services.auth_service import AuthError
from app.utils.response_wrapper import api_response

app = FastAPI(title="AI Command Center API", version="0.1.0")
app.include_router(api_router)


@app.on_event("startup")
async def startup_event() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.exception_handler(AuthError)
async def auth_error_handler(_: Request, exc: AuthError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=api_response(False, exc.message, {}),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content=api_response(False, detail, {}),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, __: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=api_response(False, "Validation error", {}),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=api_response(False, "Internal server error", {}),
    )


@app.get("/")
async def health() -> dict:
    return api_response(True, "Service is running", {"service": "ai-command-center"})
