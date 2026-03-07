from fastapi import APIRouter

from app.api.admin.analytics import router as analytics_router
from app.api.admin.logs import router as logs_router
from app.api.admin.provider_keys import router as provider_keys_router
from app.api.admin.tools import router as tools_router
from app.api.admin.users import router as users_router

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(users_router)
router.include_router(analytics_router)
router.include_router(tools_router)
router.include_router(provider_keys_router)
router.include_router(logs_router)
