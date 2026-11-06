# Gather.town v2 Virtual Office (`officegame`)

> 1-to-1 Gather.town v2 Virtual Office clone with authentic pixel aesthetic, private spaces, collaborative whiteboard, presentation projector, retro arcade, coffee bar, and directional character animations.

Accessible at: [https://office2.kopipeng.online/](https://office2.kopipeng.online/)

---

## 🌟 Key Features & Modules

### 1. Authentic Gather.town v2 Design & Pixel Art
- **Procedural Canvas Textures**: 100% zero external image dependencies, zero 404 network errors, crisp 32x32 pixel art.
- **Top-Down Office Layout**:
  - **Reception & Welcome Foyer**: Guest welcome area with decorative Persian area rug.
  - **Open Office Workstations**: 4 quad-desk engineering & product pods with dual monitors, code displays, and keyboards.
  - **Executive Boardroom Alpha**: 10 conference chairs, mahogany table, and wall-mounted presentation projector screen.
  - **Brainstorm Lab**: Round ideation table, collaborative whiteboard, and sticky notes.
  - **Cozy Lounge**: Plush navy sectional sofas, glass coffee table, and bookshelves.
  - **Cafeteria & Arcade Bar**: Espresso machine, water cooler, dining tables, retro arcade cabinet, and icebreaker wheel.
  - **Quiet Focus Pods (1-3)**: Soundproof solo focus booths.

### 2. Private Spaces & Communication Isolation
- **Dynamic Space Detection**: Entering meeting rooms (`boardroom`, `brainstorm`, `lounge`, `cafeteria`, `focus_pod_1..3`) highlights the space and dims outside areas.
- **Audio/Video & Chat Isolation**: When inside a private space, video tiles and space chat messages are strictly isolated to colleagues inside the exact same space.
- **Proximity Audio**: When in the open office hallway, participants connect smoothly when within 6 tiles (~220px).

### 3. Customizable Pixel Avatars & Animations
- **Gather Avatar Studio**: Customize skin tones, hair styles, hair colors, outfits (Hoodie, Suit & Tie, Polo), outfit colors, and accessories (Glasses, Sunglasses, Headphones, Beanie).
- **Directional 4-Way Animations**: Front (Down), Back (Up), Left, Right with 4-frame walk cycles.
- **Chair Sitting Mechanics**: Snaps pixel-perfect onto chairs with seated posture and proper facing direction. Press `X` or `E` to sit/stand, or walk away to stand up.
- **Ghost Mode (`G` key)**: Turn semi-transparent to pass through walls and colleagues.
- **Dance Mode (`Z` key)**: Celebration dance with musical and star particles.
- **Floating Reactions (`1` to `6` keys)**: Quick emoji popups (👋, ❤️, 👍, 😂, 👏, ❓).

### 4. Interactive Modules (Press `X` to Interact)
- **🎨 Collaborative Whiteboard**: Real-time multi-user drawing canvas with Pen, Highlighter, Eraser, color palette, and PNG export.
- **📺 Presentation Screen**: Synchronized YouTube video projector with presets and custom URL support.
- **🕹️ Retro Arcade Cabinet**: Playable retro Snake classic with global high-score leaderboard.
- **📌 Team Bulletin Board**: Pin company announcements and colorful sticky notes.
- **☕ Café Espresso Bar**: Brew espresso or boba tea for a +50% movement sprint speed boost (30s).
- **🎡 Icebreaker Wheel**: Spin the wheel for random team conversation topics.

---

## 🎮 Controls

| Key | Action |
|---|---|
| `WASD` / `Arrow Keys` | Move Avatar (Move while seated to Stand Up) |
| `X` or `E` | Interact with nearby object / Sit on chair |
| `G` | Toggle Ghost Mode (Pass through walls/players) |
| `Z` | Dance Celebration |
| `1` - `6` | Send floating emoji reaction |
| `Shift` | Sprint |

---

## 🚀 Deployment

Run with Docker Compose:
```bash
docker compose up -d --build
```

Container maps internal port `3000` to host port `3009` and connects to gateway network `kopipeng-net`.
Reverse-proxied via Nginx at `https://office2.kopipeng.online/` with SSL encryption.
