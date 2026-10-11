"""Generate the original, gentle adventure loop used by the invitation.

No samples or melodies from Pokémon recordings are used. Run with Python 3.
"""

import math
import random
import shutil
import struct
import subprocess
import tempfile
import wave
from pathlib import Path


RATE = 22050
BPM = 112
BEAT = 60 / BPM
BARS = 24
DURATION = BARS * 4 * BEAT
audio = [0.0] * round(DURATION * RATE)


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def note(start, length, midi, volume, voice="lead"):
    """Render one softly enveloped note directly into the mono buffer."""
    start_sample = round(start * BEAT * RATE)
    samples = round(length * BEAT * RATE)
    hz = frequency(midi)
    for i in range(samples):
        index = start_sample + i
        if index >= len(audio):
            break
        t = i / RATE
        fraction = i / samples
        if voice == "pad":
            envelope = min(1.0, t / 0.18) * min(1.0, (samples - i) / (RATE * 0.23))
            tone = math.sin(2 * math.pi * hz * t) + 0.12 * math.sin(4 * math.pi * hz * t)
        elif voice == "bass":
            envelope = min(1.0, t / 0.014) * min(1.0, (samples - i) / (RATE * 0.11))
            tone = math.sin(2 * math.pi * hz * t) + 0.2 * math.sin(4 * math.pi * hz * t)
        else:
            envelope = min(1.0, t / 0.018) * min(1.0, (samples - i) / (RATE * 0.09))
            envelope *= 0.86 + 0.14 * math.exp(-4 * fraction)
            phase = 2 * math.pi * hz * t
            tone = math.sin(phase) + 0.19 * math.sin(2 * phase) + 0.06 * math.sin(3 * phase)
        audio[index] += volume * envelope * tone


def percussion(start, loud=False):
    start_sample = round(start * BEAT * RATE)
    for i in range(round(0.13 * RATE)):
        index = start_sample + i
        if index >= len(audio):
            break
        t = i / RATE
        audio[index] += (0.045 if loud else 0.025) * math.exp(-35 * t) * math.sin(2 * math.pi * (85 - 35 * t) * t)


# G major / E minor: three different eight-bar melodies over a recurring progression.
# The phrase is deliberately original and resolves back to G for a seamless loop.
chords = [
    (43, [55, 59, 62]), (40, [52, 55, 59]),
    (48, [55, 60, 64]), (50, [57, 62, 66]),
    (47, [54, 59, 62]), (48, [55, 60, 64]),
    (45, [52, 57, 60]), (50, [57, 62, 66]),
]
phrases = [
    [[67, 71, 74, 71, 69], [64, 67, 71, 74, 71], [67, 72, 76, 74, 72], [69, 74, 78, 76, 74],
     [71, 74, 78, 74, 69], [67, 72, 76, 79, 76], [69, 72, 76, 72, 71], [69, 74, 78, 76, 74]],
    [[74, 71, 67, None, 69], [71, 67, 64, None, 67], [72, 67, 64, 67, 72], [74, 69, 66, None, 69],
     [74, 71, 66, 69, 71], [76, 72, 67, None, 72], [72, 69, 64, 69, 72], [74, 69, 66, 69, 74]],
    [[67, 71, 74, 79, 78], [76, 74, 71, 67, 64], [67, 72, 76, 79, 76], [78, 74, 69, 74, 78],
     [74, 78, 81, 78, 74], [76, 79, 83, 79, 76], [72, 76, 79, 76, 72], [74, 78, 76, 74, 71]],
]

for bar in range(BARS):
    bass, harmony = chords[bar % 8]
    start = bar * 4
    for pitch in harmony:
        note(start, 3.95, pitch - 12, 0.035, "pad")
    for beat in (0, 2):
        note(start + beat, 1.8, bass, 0.10, "bass")
        percussion(start + beat, beat == 0)
    for step in range(8):
        note(start + step * 0.5, 0.35, harmony[step % 3], 0.027)
    melody = phrases[bar // 8][bar % 8]
    for offset, pitch in zip((0, 0.75, 1.5, 2.5, 3.25), melody):
        if pitch is not None:
            note(start + offset, 0.58 if offset != 2.5 else 0.68, pitch, 0.115)

# A subtle two-beat shaker is quiet enough not to compete with the melody.
rng = random.Random(7)
for beat in range(BARS * 4):
    if beat % 2:
        begin = round((beat + 0.5) * BEAT * RATE)
        for i in range(round(0.035 * RATE)):
            index = begin + i
            if index < len(audio):
                audio[index] += rng.uniform(-1, 1) * 0.007 * math.exp(-110 * i / RATE)

# Zero-crossing-like fade at the loop boundary avoids a click on repeat.
fade = round(0.10 * RATE)
peak = max(abs(sample) for sample in audio)
output = Path(__file__).resolve().parents[1] / "public/assets/theme-v2.m4a"
with tempfile.TemporaryDirectory(prefix="convitekiko-theme-") as tmp:
    pcm = Path(tmp) / "theme.wav"
    with wave.open(str(pcm), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        chunk = bytearray()
        for index, sample in enumerate(audio):
            edge = min(1.0, index / fade, (len(audio) - 1 - index) / fade)
            chunk.extend(struct.pack("<h", round(max(-1.0, min(1.0, sample / peak * edge * 0.65)) * 32767)))
            if len(chunk) >= 65536:
                wav.writeframesraw(chunk)
                chunk.clear()
        wav.writeframes(chunk)
    if shutil.which("afconvert"):
        command = ["afconvert", str(pcm), "-o", str(output), "-f", "m4af", "-d", "aac @44100", "-b", "96000"]
    elif shutil.which("ffmpeg"):
        command = ["ffmpeg", "-y", "-i", str(pcm), "-c:a", "aac", "-b:a", "96k", str(output)]
    else:
        raise RuntimeError("Install afconvert or ffmpeg to encode the music as AAC.")
    subprocess.run(command, check=True)
