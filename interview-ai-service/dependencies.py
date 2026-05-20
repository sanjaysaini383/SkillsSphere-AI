import os
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="Authorization", auto_error=True)

async def verify_internal_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("INTERNAL_SERVICE_KEY", "dev_internal_key")
    if api_key != f"Bearer {expected_key}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key"
        )
    return True
