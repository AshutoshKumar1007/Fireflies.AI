import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from seed import seed_database
from routers import meetings, transcripts, action_items, search

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        seed_database(db)

    yield
    
app = FastAPI(
    title='Fireflies Clone API',
    description='AI-powered meeting management platform API',
    version='1.0.0',
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "https://fireflies-ai-seven.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    origins = [*origins, frontend_url]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(meetings.router, prefix='/api')
app.include_router(transcripts.router, prefix='/api')
app.include_router(action_items.router, prefix='/api')
app.include_router(search.router, prefix='/api')

@app.get("/health", tags=["Health"])
def health_check():
    return {'status': 'healthy'}
