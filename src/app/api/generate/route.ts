import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Gemini 2.5 Pro with thinking for better RIPscrip generation
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent';

// RIPscrip command reference for the prompt
const RIPSCRIP_REFERENCE = `
RIPscrip v1.54 Command Reference (Base36 coordinates, 0-9=0-9, A-Z=10-35):

DRAWING COMMANDS:
|c<fg><bg> - Set foreground/background color (0-F for 16 EGA colors)
|L<x0><y0><x1><y1> - Draw line from (x0,y0) to (x1,y1) [each coord is 2 base36 chars]
|R<x0><y0><x1><y1> - Draw rectangle outline
|B<x0><y0><x1><y1> - Draw filled rectangle (bar)
|C<cx><cy><r> - Draw circle at center (cx,cy) with radius r
|O<cx><cy><sa><ea><rx><ry> - Draw ellipse/arc
|X<x><y> - Draw single pixel
|m<x><y> - Move cursor to position
|l<x><y> - Draw line from cursor to position
|P<count><x0><y0>...<xn><yn> - Draw polyline

FILL COMMANDS:
|S<style><color> - Set fill style (0=empty, 1=solid, etc)
|F<x><y><border> - Flood fill from point to border color

SPECIAL:
|* - Reset/clear screen
|w<x0><y0><x1><y1> - Define text window

EGA 16-COLOR PALETTE:
0=Black, 1=Blue, 2=Green, 3=Cyan, 4=Red, 5=Magenta, 6=Brown, 7=LightGray
8=DarkGray, 9=LightBlue, A=LightGreen, B=LightCyan, C=LightRed, D=LightMagenta, E=Yellow, F=White

COORDINATE SYSTEM:
- Resolution: 640x350 (EGA standard)
- Coordinates use 2 base36 characters each (00-ZZ = 0-1295)
- Example: position (100, 50) = "2S" + "1E" (100 in base36 = 2S, 50 = 1E)

Base36 encoding helper:
- 0-9 = 0-9
- 10-35 = A-Z
- To encode a number: div by 36 gives first digit, mod 36 gives second
- 100 = 2*36 + 28 = "2S"
- 320 = 8*36 + 32 = "8W"
`;

interface GenerateRequest {
  prompt: string;
  complexity: number;
  resolution: string;
  palette: string;
  interactive: boolean;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body: GenerateRequest = await request.json();
    const { prompt, complexity, resolution, palette, interactive } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const [width, height] = resolution.split('x').map(Number);
    
    // Build the generation prompt
    const systemPrompt = `You are a RIPscrip graphics artist from the 1990s BBS era. Generate valid RIPscrip v1.54 code that renders vector graphics on a ${width}x${height} pixel canvas.

${RIPSCRIP_REFERENCE}

IMPORTANT RULES:
1. Output ONLY valid RIPscrip commands, no explanations or markdown
2. Start with |* to reset, then |c to set initial colors
3. Use base36 encoding for ALL coordinates (2 chars each, padded with 0 if needed)
4. Keep within canvas bounds (0-${width - 1} x 0-${height - 1})
5. Complexity level: ${complexity}% (${complexity < 30 ? 'simple shapes only' : complexity < 70 ? 'moderate detail' : 'high detail with many elements'})
6. Color palette: ${palette === 'ega16' ? 'Full 16 EGA colors' : palette === 'cga4' ? 'Only colors 0,3,5,F (CGA)' : 'Only colors 0,F (monochrome)'}
${interactive ? '7. Include button regions if appropriate for the scene' : ''}

Create a visually interesting scene that captures the nostalgic BBS art aesthetic.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Generate RIPscrip code for: ${prompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0, // Required for thinking
          maxOutputTokens: 16384,
          thinkingConfig: {
            thinkingBudget: 2048, // Low thinking budget
          }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'AI generation failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    let ripscrip = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up the output - remove any markdown or explanations
    ripscrip = ripscrip
      .replace(/```[a-z]*\n?/g, '')  // Remove code blocks
      .replace(/```/g, '')
      .trim();

    // Ensure it starts with reset if not already
    if (!ripscrip.startsWith('|*')) {
      ripscrip = '|*\n' + ripscrip;
    }

    return NextResponse.json({ ripscrip });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
