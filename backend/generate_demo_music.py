import os
import math
import struct
import wave

MUSIC_DIR = os.path.join(os.path.dirname(__file__), "static", "music")
os.makedirs(MUSIC_DIR, exist_ok=True)


def generate_melody(filename: str, chords: list, duration_sec: int = 240, sample_rate: int = 22050):
    """
    Generate beautiful harmonic melodies rapidly using precomputed cycle blocks.
    """
    filepath = os.path.join(MUSIC_DIR, filename)
    chord_len_sec = 3.0
    samples_per_chord = int(chord_len_sec * sample_rate)
    
    # Pre-generate one full loop of chords
    loop_buffer = bytearray()
    for chord in chords:
        for i in range(samples_per_chord):
            t = i / sample_rate
            chord_pos = i / samples_per_chord
            envelope = math.sin(chord_pos * math.pi) ** 0.8
            
            sample_l = 0.0
            sample_r = 0.0
            for freq in chord:
                w1 = math.sin(2 * math.pi * freq * t)
                w2 = 0.3 * math.sin(2 * math.pi * freq * 2 * t)
                w3 = 0.15 * math.sin(2 * math.pi * freq * 0.5 * t)
                comb = (w1 + w2 + w3) * envelope * 0.18
                pan = 0.5 + 0.25 * math.sin(2 * math.pi * 0.15 * t + freq)
                sample_l += comb * (1.0 - pan)
                sample_r += comb * pan
            
            sample_l = max(-0.9, min(0.9, sample_l))
            sample_r = max(-0.9, min(0.9, sample_r))
            int_l = int(sample_l * 32767.0)
            int_r = int(sample_r * 32767.0)
            loop_buffer += struct.pack('<hh', int_l, int_r)

    total_samples = int(duration_sec * sample_rate)
    bytes_per_sample = 4  # 16-bit stereo = 4 bytes
    target_bytes = total_samples * bytes_per_sample
    
    # Repeat loop buffer until target duration
    full_buffer = bytearray()
    while len(full_buffer) < target_bytes:
        full_buffer += loop_buffer
    full_buffer = full_buffer[:target_bytes]

    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(full_buffer)

    print(f"Generated track: {filename} ({duration_sec}s)")


if __name__ == "__main__":
    # --- Classic Lo-Fi Tracks ---
    generate_melody("midnight_serenade.mp3", [[261.63, 329.63, 392.00, 493.88], [220.00, 261.63, 329.63, 392.00]], duration_sec=184)
    generate_melody("stargazing.mp3", [[293.66, 369.99, 440.00, 554.37], [246.94, 293.66, 369.99, 440.00]], duration_sec=212)
    generate_melody("rainy_reflections.mp3", [[174.61, 220.00, 261.63, 329.63], [164.81, 196.00, 246.94, 293.66]], duration_sec=195)
    generate_melody("warm_coffee.mp3", [[329.63, 415.30, 493.88, 622.25], [277.18, 329.63, 415.30, 493.88]], duration_sec=178)
    generate_melody("distant_glow.mp3", [[207.65, 261.63, 311.13, 392.00], [174.61, 207.65, 261.63, 311.13]], duration_sec=225)

    # --- Latest Hindi & Bollywood Hits ---
    generate_melody("kesariya.mp3", [[293.66, 369.99, 440.00], [196.00, 246.94, 293.66], [246.94, 293.66, 369.99], [220.00, 277.18, 329.63]], duration_sec=268)
    generate_melody("apna_bana_le.mp3", [[261.63, 329.63, 392.00], [196.00, 246.94, 293.66], [220.00, 261.63, 329.63], [174.61, 220.00, 261.63]], duration_sec=264)
    generate_melody("o_maahi.mp3", [[185.00, 220.00, 277.18], [146.83, 185.00, 220.00], [220.00, 277.18, 329.63], [164.81, 207.65, 246.94]], duration_sec=233)
    generate_melody("pehle_bhi_main.mp3", [[164.81, 196.00, 246.94], [130.81, 164.81, 196.00], [196.00, 246.94, 293.66], [146.83, 185.00, 220.00]], duration_sec=250)
    generate_melody("raataan_lambiyan.mp3", [[277.18, 329.63, 415.30], [220.00, 277.18, 329.63], [164.81, 207.65, 246.94], [246.94, 311.13, 369.99]], duration_sec=230)
    generate_melody("tum_hi_ho.mp3", [[220.00, 261.63, 329.63], [174.61, 220.00, 261.63], [196.00, 246.94, 293.66], [164.81, 196.00, 246.94]], duration_sec=262)
    generate_melody("heeriye.mp3", [[196.00, 246.94, 293.66], [146.83, 185.00, 220.00], [164.81, 196.00, 246.94], [130.81, 164.81, 196.00]], duration_sec=195)
    generate_melody("satranga.mp3", [[293.66, 369.99, 440.00], [185.00, 220.00, 277.18], [196.00, 246.94, 293.66], [220.00, 277.18, 329.63]], duration_sec=272)
    generate_melody("chaleya.mp3", [[246.94, 293.66, 369.99], [196.00, 246.94, 293.66], [146.83, 185.00, 220.00], [220.00, 277.18, 329.63]], duration_sec=200)
    generate_melody("tum_se_hi.mp3", [[155.56, 196.00, 233.08], [207.65, 261.63, 311.13], [233.08, 293.66, 349.23], [130.81, 155.56, 196.00]], duration_sec=323)
