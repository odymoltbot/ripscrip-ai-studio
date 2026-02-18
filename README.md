# RIPscrip AI Studio

**AI-powered revival of 1990s BBS vector graphics**

Generate retro RIPscrip artwork using Gemini AI. Experience the nostalgia of BBS-era vector graphics with modern AI capabilities.

![Preview](docs/preview.png)

## What is RIPscrip?

[RIPscrip](https://en.wikipedia.org/wiki/Remote_Imaging_Protocol) (Remote Imaging Protocol) was a vector graphics encoding used in Bulletin Board Systems (BBSs) during the 1990s. It allowed BBS software to render graphics, buttons, and interactive elements using a compact command language—similar to SVG today, but optimized for 2400 baud modems.

RIPscrip typically used EGA graphics mode (640×350 pixels, 16 colors) and featured commands for drawing lines, rectangles, circles, filled shapes, and even clickable button regions.

## Features

- 🎨 **AI-Powered Generation**: Describe a scene in natural language and get RIPscrip code
- 📸 **Image Vectorization**: Upload an image and convert it to RIPscrip commands
- 🖥️ **Live Preview**: Watch your graphics render in real-time, simulating the line-by-line modem experience
- 📥 **Download**: Export your creations as `.rip` files
- 🎛️ **Customization**: Adjust complexity, resolution, and color palettes
- 🌙 **Dark Mode**: Because BBSs were always dark mode

## Getting Started

### Prerequisites

- Node.js 18+ 
- A [Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ripscrip-ai-studio.git
cd ripscrip-ai-studio

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Add your Gemini API key to .env.local
# GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ripscrip-ai-studio&env=GEMINI_API_KEY&envDescription=Gemini%20API%20key%20for%20AI%20generation)

Add your `GEMINI_API_KEY` as an environment variable in Vercel.

## Usage

### Generate from Text

1. Enter a description like "A cyberpunk cityscape with neon signs and flying cars"
2. Adjust settings (complexity, resolution, palette)
3. Click "Generate RIPscrip"
4. Watch the preview render line-by-line
5. Download the `.rip` file

### Vectorize an Image

1. Click "Upload Image" in the sidebar
2. Select an image file
3. The AI will analyze and convert it to RIPscrip commands

## RIPscrip Command Reference

| Command | Description |
|---------|-------------|
| `\|*` | Reset/clear screen |
| `\|c<fg><bg>` | Set foreground/background color (0-F) |
| `\|L<x0><y0><x1><y1>` | Draw line |
| `\|R<x0><y0><x1><y1>` | Draw rectangle outline |
| `\|B<x0><y0><x1><y1>` | Draw filled rectangle |
| `\|C<cx><cy><r>` | Draw circle |
| `\|X<x><y>` | Draw single pixel |
| `\|F<x><y><border>` | Flood fill |

Coordinates use base36 encoding (2 characters each).

## EGA Color Palette

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Black | `#000000` |
| 1 | Blue | `#0000AA` |
| 2 | Green | `#00AA00` |
| 3 | Cyan | `#00AAAA` |
| 4 | Red | `#AA0000` |
| 5 | Magenta | `#AA00AA` |
| 6 | Brown | `#AA5500` |
| 7 | Light Gray | `#AAAAAA` |
| 8 | Dark Gray | `#555555` |
| 9 | Light Blue | `#5555FF` |
| A | Light Green | `#55FF55` |
| B | Light Cyan | `#55FFFF` |
| C | Light Red | `#FF5555` |
| D | Light Magenta | `#FF55FF` |
| E | Yellow | `#FFFF55` |
| F | White | `#FFFFFF` |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React, Tailwind CSS, shadcn/ui
- **AI**: Google Gemini 2.0 Flash
- **Canvas**: HTML5 Canvas for rendering
- **Deployment**: Vercel

## Resources

- [16colors.rs](https://16colo.rs/tags/content/ripscrip) - Archive of classic RIP art
- [RIPtermJS](https://github.com/cgorringe/RIPtermJS) - Inspiration for the renderer
- [RIPscrip Wikipedia](https://en.wikipedia.org/wiki/Remote_Imaging_Protocol)

## Contributing

PRs welcome! Areas of interest:
- Better RIPscrip parser/renderer
- More accurate flood fill with patterns
- Font rendering
- WebSocket connection to actual BBSs

## License

MIT
