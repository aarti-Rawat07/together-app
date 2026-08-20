import pytest
from app.websocket.manager import RoomConnectionManager
from app.models.room import Room
from app.models.user import User


class MockWebSocket:
    def __init__(self):
        self.accepted = False
        self.closed = False
        self.close_code = None
        self.close_reason = None
        self.sent_messages = []

    async def accept(self):
        self.accepted = True

    async def close(self, code: int = 1000, reason: str = ""):
        self.closed = True
        self.close_code = code
        self.close_reason = reason

    async def send_json(self, data):
        self.sent_messages.append(data)


@pytest.mark.asyncio
async def test_manager_connect_and_strict_two_user_limit():
    mgr = RoomConnectionManager()

    # Room with User 1 and User 2
    room = Room(id=1, uuid_token="room-test-uuid", creator_id=1, partner_id=2)
    user_1 = User(id=1, username="user1", name="User 1")
    user_2 = User(id=2, username="user2", name="User 2")
    user_3 = User(id=3, username="user3", name="User 3")  # Not in room

    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    ws3 = MockWebSocket()

    # 1. User 1 connects successfully
    success1 = await mgr.connect(ws1, room, user_1)
    assert success1 is True
    assert ws1.accepted is True
    assert mgr.get_room_participants_count(room.uuid_token) == 1

    # 2. User 2 connects successfully
    success2 = await mgr.connect(ws2, room, user_2)
    assert success2 is True
    assert ws2.accepted is True
    assert mgr.get_room_participants_count(room.uuid_token) == 2

    # 3. Unauthorized User 3 tries to connect -> rejected by is_member
    success3 = await mgr.connect(ws3, room, user_3)
    assert success3 is False
    assert ws3.closed is True
    assert ws3.close_code == 4003

    # Disconnect
    mgr.disconnect(room.uuid_token, user_1.id)
    mgr.disconnect(room.uuid_token, user_2.id)
    assert mgr.get_room_participants_count(room.uuid_token) == 0
