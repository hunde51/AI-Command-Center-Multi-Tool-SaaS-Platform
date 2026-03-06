from fastapi import APIRouter

from app.api.admin.router import router as admin_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.tools import router as tools_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(admin_router)
api_router.include_router(chat_router)
api_router.include_router(analytics_router)
api_router.include_router(tools_router)
