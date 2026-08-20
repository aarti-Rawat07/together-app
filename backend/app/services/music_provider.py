from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.music import Track, CategoryResponse


class MusicProvider(ABC):
    """Abstract Music Provider for extensibility with Spotify/SoundCloud/Custom APIs."""
    
    @abstractmethod
    async def get_tracks(self) -> List[Track]:
        pass

    @abstractmethod
    async def get_track(self, track_id: str) -> Optional[Track]:
        pass

    @abstractmethod
    async def search_tracks(self, query: str) -> List[Track]:
        pass

    @abstractmethod
    async def add_track(self, track: Track) -> Track:
        pass

    @abstractmethod
    async def get_categories(self) -> List[CategoryResponse]:
        pass


class LocalAudioProvider(MusicProvider):
    """Provider serving a rich catalog of latest Hindi hits, Bollywood romance, and Lo-Fi tracks."""

    def __init__(self):
        self._tracks: List[Track] = [
            # --- Latest Hindi Hits & Bollywood Romance ---
            Track(
                id="hindi-kesariya",
                title="Kesariya",
                artist="Arijit Singh, Pritam, Amitabh Bhattacharya",
                album="Brahmāstra",
                duration=268.0,
                url="/static/music/kesariya.mp3",
                cover_url="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
                category="Latest Hindi Hits"
            ),
            Track(
                id="hindi-apna-bana-le",
                title="Apna Bana Le",
                artist="Arijit Singh, Sachin-Jigar",
                album="Bhediya",
                duration=264.0,
                url="/static/music/apna_bana_le.mp3",
                cover_url="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),
            Track(
                id="hindi-o-maahi",
                title="O Maahi",
                artist="Arijit Singh, Pritam, Irshad Kamil",
                album="Dunki",
                duration=233.0,
                url="/static/music/o_maahi.mp3",
                cover_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
                category="Latest Hindi Hits"
            ),
            Track(
                id="hindi-pehle-bhi-main",
                title="Pehle Bhi Main",
                artist="Vishal Mishra, Harshavardhan Rameshwar",
                album="Animal",
                duration=250.0,
                url="/static/music/pehle_bhi_main.mp3",
                cover_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
                category="Latest Hindi Hits"
            ),
            Track(
                id="hindi-satranga",
                title="Satranga",
                artist="Arijit Singh, Shreyas Puranik, Siddharth-Garima",
                album="Animal",
                duration=272.0,
                url="/static/music/satranga.mp3",
                cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),
            Track(
                id="hindi-raataan-lambiyan",
                title="Raataan Lambiyan",
                artist="Jubin Nautiyal, Asees Kaur, Tanishk Bagchi",
                album="Shershaah",
                duration=230.0,
                url="/static/music/raataan_lambiyan.mp3",
                cover_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),
            Track(
                id="hindi-chaleya",
                title="Chaleya",
                artist="Arijit Singh, Shilpa Rao, Anirudh Ravichander",
                album="Jawan",
                duration=200.0,
                url="/static/music/chaleya.mp3",
                cover_url="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80",
                category="Latest Hindi Hits"
            ),
            Track(
                id="hindi-heeriye",
                title="Heeriye",
                artist="Jasleen Royal, Arijit Singh, Dulquer Salmaan",
                album="Heeriye - Single",
                duration=195.0,
                url="/static/music/heeriye.mp3",
                cover_url="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),
            Track(
                id="hindi-tum-hi-ho",
                title="Tum Hi Ho",
                artist="Arijit Singh, Mithoon",
                album="Aashiqui 2",
                duration=262.0,
                url="/static/music/tum_hi_ho.mp3",
                cover_url="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),
            Track(
                id="hindi-tum-se-hi",
                title="Tum Se Hi",
                artist="Mohit Chauhan, Pritam, Irshad Kamil",
                album="Jab We Met",
                duration=323.0,
                url="/static/music/tum_se_hi.mp3",
                cover_url="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80",
                category="Bollywood Romance"
            ),

            # --- Lo-Fi & Ambient Romance ---
            Track(
                id="track-1",
                title="Midnight Serenade",
                artist="Aura & Echo",
                album="Together Moments",
                duration=184.0,
                url="/static/music/midnight_serenade.mp3",
                cover_url="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=60",
                category="Lo-Fi Chill"
            ),
            Track(
                id="track-2",
                title="Stargazing With You",
                artist="Luna Wave",
                album="Night Whispers",
                duration=212.0,
                url="/static/music/stargazing.mp3",
                cover_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60",
                category="Lo-Fi Chill"
            ),
            Track(
                id="track-3",
                title="Rainy Window Reflections",
                artist="Velvet Sound",
                album="Cozy Nights",
                duration=195.0,
                url="/static/music/rainy_reflections.mp3",
                cover_url="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=60",
                category="Ambient Rain"
            ),
            Track(
                id="track-4",
                title="Warm Coffee & Soft Light",
                artist="Sunday Mornings",
                album="Gentle Heart",
                duration=178.0,
                url="/static/music/warm_coffee.mp3",
                cover_url="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60",
                category="Acoustic Romance"
            ),
            Track(
                id="track-5",
                title="Distant Glow",
                artist="Solar Drift",
                album="Connected Worlds",
                duration=225.0,
                url="/static/music/distant_glow.mp3",
                cover_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60",
                category="Lo-Fi Chill"
            ),
        ]

    async def get_tracks(self) -> List[Track]:
        return self._tracks

    async def get_track(self, track_id: str) -> Optional[Track]:
        for track in self._tracks:
            if track.id == track_id:
                return track
        return None

    async def search_tracks(self, query: str) -> List[Track]:
        q = query.lower().strip()
        if not q:
            return self._tracks
        return [
            track for track in self._tracks
            if q in track.title.lower() or q in track.artist.lower() or q in (track.album or "").lower() or q in (track.category or "").lower()
        ]

    async def add_track(self, track: Track) -> Track:
        self._tracks.insert(0, track)  # Prepend new track to top of playlist
        return track

    async def get_categories(self) -> List[CategoryResponse]:
        cats = {}
        for track in self._tracks:
            cat_name = track.category or "General"
            if cat_name not in cats:
                cats[cat_name] = []
            cats[cat_name].append(track)
        
        return [
            CategoryResponse(id=name.lower().replace(" ", "-"), name=name, tracks=tracks)
            for name, tracks in cats.items()
        ]


# Singleton instance
default_music_provider = LocalAudioProvider()
