import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_start_room_with_accepted_contact(client: AsyncClient, connected_users, token_a, token_b):
    user_a, user_b = connected_users

    # User A starts room with User B
    response = await client.post("/api/rooms", json={
        "partner_id": user_b.id
    }, headers={"Authorization": f"Bearer {token_a}"})

    assert response.status_code == 201
    room = response.json()
    assert "uuid_token" in room
    assert room["creator_id"] == user_a.id
    assert room["partner_id"] == user_b.id
    assert room["is_active"] is True
    assert room["playback_state"] is not None


@pytest.mark.asyncio
async def test_cannot_start_room_without_accepted_contact(client: AsyncClient, user_a, user_c, token_a):
    # User A and User C are not connected contacts
    response = await client.post("/api/rooms", json={
        "partner_id": user_c.id
    }, headers={"Authorization": f"Bearer {token_a}"})

    assert response.status_code == 403
    assert "accepted contact" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_room_strict_two_person_authorization(
    client: AsyncClient,
    connected_users,
    user_c,
    token_a,
    token_b,
    token_c
):
    user_a, user_b = connected_users

    # 1. User A starts room
    create_res = await client.post("/api/rooms", json={
        "partner_id": user_b.id
    }, headers={"Authorization": f"Bearer {token_a}"})
    room_uuid = create_res.json()["uuid_token"]

    # 2. User A can access room
    res_a = await client.get(f"/api/rooms/{room_uuid}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200

    # 3. User B can access room
    res_b = await client.get(f"/api/rooms/{room_uuid}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 200

    # 4. CRITICAL: User C (Third person) is strictly rejected!
    res_c = await client.get(f"/api/rooms/{room_uuid}", headers={"Authorization": f"Bearer {token_c}"})
    assert res_c.status_code == 403
    assert "Only the two authorized participants" in res_c.json()["detail"]


@pytest.mark.asyncio
async def test_get_active_room(client: AsyncClient, connected_users, token_a):
    user_a, user_b = connected_users

    # Create room
    await client.post("/api/rooms", json={
        "partner_id": user_b.id
    }, headers={"Authorization": f"Bearer {token_a}"})

    # Get active
    active_res = await client.get("/api/rooms/active/current", headers={"Authorization": f"Bearer {token_a}"})
    assert active_res.status_code == 200
    assert active_res.json()["is_active"] is True
