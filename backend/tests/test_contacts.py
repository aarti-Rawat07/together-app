import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_contact_request(client: AsyncClient, user_a, user_b, token_a):
    response = await client.post("/api/contacts/request", json={
        "addressee_username_or_email": user_b.username
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PENDING"
    assert data["requester_id"] == user_a.id
    assert data["addressee_id"] == user_b.id


@pytest.mark.asyncio
async def test_cannot_send_request_to_self(client: AsyncClient, user_a, token_a):
    response = await client.post("/api/contacts/request", json={
        "addressee_username_or_email": user_a.username
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert response.status_code == 400
    assert "yourself" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_accept_contact_request(client: AsyncClient, user_a, user_b, token_a, token_b):
    # User A sends request to User B
    req = await client.post("/api/contacts/request", json={
        "addressee_username_or_email": user_b.email
    }, headers={"Authorization": f"Bearer {token_a}"})
    contact_id = req.json()["id"]

    # User B accepts request
    acc = await client.post(f"/api/contacts/{contact_id}/accept", headers={
        "Authorization": f"Bearer {token_b}"
    })
    assert acc.status_code == 200
    assert acc.json()["status"] == "ACCEPTED"

    # Verify in contacts list
    list_res = await client.get("/api/contacts", headers={"Authorization": f"Bearer {token_a}"})
    assert list_res.status_code == 200
    assert len(list_res.json()["accepted"]) == 1
    assert list_res.json()["accepted"][0]["partner"]["username"] == user_b.username
