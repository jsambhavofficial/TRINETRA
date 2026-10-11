"""
Request ID and Telemetry Middleware
Attaches unique request_id and measures execution time for traceability.
"""
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import logger


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", f"req-{uuid.uuid4().hex[:12]}")
        request.state.request_id = request_id

        start_time = time.time()
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time-Ms"] = f"{process_time:.2f}"

            if not request.url.path.endswith("/health"):
                logger.info(
                    f"{request.method} {request.url.path} status={response.status_code} "
                    f"duration={process_time:.1f}ms req_id={request_id}"
                )
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Unhandled Exception in {request.method} {request.url.path}: {str(e)} "
                f"duration={process_time:.1f}ms req_id={request_id}"
            )
            raise
