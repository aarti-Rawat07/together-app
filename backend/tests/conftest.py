import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.contact import Contact
from app.auth.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine):
    SessionMaker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    async with SessionMaker() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def user_a(db_session) -> User:
    user = User(
        name="Aarti Sharma",
        username="aarti",
        email="aarti@together.app",
        hashed_password=get_password_hash("Password123!"),
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=aarti",
        status="online"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def user_b(db_session) -> User:
    user = User(
        name="Rohan Verma",
        username="rohan",
        email="rohan@together.app",
        hashed_password=get_password_hash("Password123!"),
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=rohan",
        status="online"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def user_c(db_session) -> User:
    """Third user - to test rejection from 2-person room."""
    user = User(
        name="Charlie Third",
        username="charlie",
        email="charlie@together.app",
        hashed_password=get_password_hash("Password123!"),
        avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=charlie",
        status="online"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
def token_a(user_a) -> str:
    return create_access_token(subject=user_a.id)


@pytest_asyncio.fixture(scope="function")
def token_b(user_b) -> str:
    return create_access_token(subject=user_b.id)


@pytest_asyncio.fixture(scope="function")
def token_c(user_c) -> str:
    return create_access_token(subject=user_c.id)


@pytest_asyncio.fixture(scope="function")
async def connected_users(db_session, user_a, user_b):
    """Fixture providing two users with ACCEPTED contact status."""
    contact = Contact(
        requester_id=user_a.id,
        addressee_id=user_b.id,
        status="ACCEPTED"
    )
    db_session.add(contact)
    await db_session.commit()
    return user_a, user_b
