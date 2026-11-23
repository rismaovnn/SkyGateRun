"""Procedurally synthesises all SFX + 2 music loops for Sky Gate Run (royalty-free, made here)."""
import numpy as np, wave, subprocess, os
SR = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)

def env(n, a=0.005, r=0.1):
    e = np.ones(n); ai = min(n, int(a * SR)); ri = min(n - ai, int(r * SR))
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri) ** 2
    return e
def tone(f, d, kind='sine', vol=0.5, a=0.005, r=0.1, slide=None):
    n = int(d * SR); t = np.arange(n) / SR
    freq = np.full(n, f) if slide is None else np.linspace(f, slide, n)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    if kind == 'sine': w = np.sin(ph)
    elif kind == 'square': w = np.sign(np.sin(ph)) * 0.6
    elif kind == 'tri': w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif kind == 'saw': w = 2 * ((ph / (2 * np.pi)) % 1) - 1
    return w * env(n, a, r) * vol
def noise(d, vol=0.4, r=0.1, lp=0.2):
    n = int(d * SR); w = np.random.uniform(-1, 1, n)
    out = np.zeros(n); acc = 0
    for i in range(n): acc += lp * (w[i] - acc); out[i] = acc
    return out * env(n, 0.002, r) * vol / max(lp, 0.05) * 0.3
def seq(parts):
    return np.concatenate(parts)
def mix(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def save(name, x):
    x = np.clip(x / max(1e-9, np.max(np.abs(x))) * 0.89, -1, 1)
    wav = f'/tmp/{name}.wav'
    with wave.open(wav, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-b:a', '64k', f'{OUT}/{name}.mp3'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', f'{OUT}/{name}.ogg'], check=True)

N = lambda m: 440 * 2 ** ((m - 69) / 12)
save('sfx_tap', tone(900, 0.06, 'sine', r=0.05, slide=600))
save('sfx_gate_good', seq([tone(N(72), 0.07, 'tri'), tone(N(76), 0.07, 'tri'), tone(N(79), 0.16, 'tri', r=0.12)]))
save('sfx_gate_bad', tone(320, 0.32, 'saw', vol=0.4, slide=110, r=0.15))
save('sfx_coin', seq([tone(N(88), 0.05, 'square', vol=0.3, r=0.01), tone(N(93), 0.14, 'square', vol=0.3, r=0.12)]))
save('sfx_perfect', mix(seq([tone(N(79), 0.08, 'tri'), tone(N(84), 0.08, 'tri'), tone(N(88), 0.08, 'tri'), tone(N(91), 0.3, 'tri', r=0.25)]), noise(0.5, 0.08, 0.4, 0.9)))
save('sfx_combo', seq([tone(N(76), 0.06, 'square', 0.3), tone(N(81), 0.06, 'square', 0.3), tone(N(86), 0.18, 'square', 0.3, r=0.15)]))
save('sfx_hit', mix(noise(0.25, 0.9, 0.2, 0.15), tone(120, 0.25, 'sine', 0.8, slide=50)))
save('sfx_win', seq([tone(N(72), 0.12, 'tri'), tone(N(76), 0.12, 'tri'), tone(N(79), 0.12, 'tri'), mix(tone(N(84), 0.6, 'tri', r=0.4), tone(N(88), 0.6, 'tri', 0.3, r=0.4))]))
save('sfx_lose', seq([tone(N(67), 0.18, 'tri'), tone(N(63), 0.18, 'tri'), tone(N(60), 0.5, 'tri', r=0.4, slide=N(55))]))
save('sfx_claim', mix(seq([tone(N(84), 0.06, 'square', 0.25), tone(N(88), 0.06, 'square', 0.25), tone(N(91), 0.06, 'square', 0.25), tone(N(96), 0.25, 'square', 0.25, r=0.2)]), noise(0.4, 0.05, 0.3, 0.9)))
save('sfx_whoosh', noise(0.28, 0.6, 0.2, 0.08))
save('sfx_tick', tone(1300, 0.05, 'square', 0.3, r=0.04))

def music(bpm, prog, lead, bars=8, name='m'):
    beat = 60 / bpm; step = beat / 2
    total = int(bars * 4 * beat * SR); out = np.zeros(total)
    def put(x, at):
        i = int(at * SR); j = min(total, i + len(x)); out[i:j] += x[:j - i]
    for bar in range(bars):
        root = prog[bar % len(prog)]
        for s in range(8):
            t0 = (bar * 8 + s) * step
            put(tone(N(root - 24 + (12 if s % 2 else 0)), step * 0.9, 'tri', 0.35, r=0.05), t0)       # bass
            if s % 2 == 0: put(noise(0.05, 0.25 if s % 4 == 0 else 0.12, 0.04, 0.9 if s % 4 else 0.2), t0)  # hats/kick
            if s in (0, 4): put(tone(70, 0.12, 'sine', 0.6, slide=40, r=0.08), t0)                      # kick
            note = lead[(bar * 8 + s) % len(lead)]
            if note: put(tone(N(root + note), step * 0.8, 'square', 0.12, r=0.04), t0)
    return out
save('music_menu', music(104, [60, 65, 57, 67], [12, 0, 16, 0, 19, 0, 16, 14, 12, 0, 14, 0, 16, 0, 0, 0], bars=8))
save('music_run', music(128, [62, 58, 60, 57], [12, 15, 19, 15, 24, 19, 15, 12, 14, 17, 21, 17, 24, 21, 19, 17], bars=8))
print('ok', sorted(os.listdir(OUT)))
