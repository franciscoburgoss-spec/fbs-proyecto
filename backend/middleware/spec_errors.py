from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from spec_engine.validator import TransitionError


def register_spec_error_handlers(app: FastAPI):
    @app.exception_handler(TransitionError)
    async def transition_error_handler(request: Request, exc: TransitionError):
        return JSONResponse(
            status_code=exc.http,
            content={"error": exc.code, "details": exc.details},
        )
