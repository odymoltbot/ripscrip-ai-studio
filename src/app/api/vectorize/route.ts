import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Gemini 2.5 Pro with thinking for better vectorization
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

// RIPscrip reference (same as generate route)
const RIPSCRIP_REFERENCE = `
RIPscrip v1.54 Command Reference (Base36 coordinates):

|c<fg><bg> - Set foreground/background color (0-F for 16 EGA colors)
|L<x0><y0><x1><y1> - Draw line
|R<x0><y0><x1><y1> - Draw rectangle outline
|B<x0><y0><x1><y1> - Draw filled rectangle
|C<cx><cy><r> - Draw circle
|O<cx><cy><sa><ea><rx><ry> - Draw ellipse
|X<x><y> - Draw pixel
|P<count><coords...> - Draw polyline
|S<style><color> - Set fill style
|F<x><y><border> - Flood fill
|* - Reset screen

Canvas: 640x350, each coordinate is 2 base36 chars.
Colors: 0=Black, 1=Blue, 2=Green, 3=Cyan, 4=Red, 5=Magenta, 6=Brown, 7=LightGray, 8=DarkGray, 9=LightBlue, A=LightGreen, B=LightCyan, C=LightRed, D=LightMagenta, E=Yellow, F=White
`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const complexity = parseInt(formData.get('complexity') as string) || 50;
    const palette = (formData.get('palette') as string) || 'ega16';

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = image.type || 'image/png';

    const systemPrompt = `You are a RIPscrip graphics converter. Analyze the provided image and convert it to RIPscrip v1.54 vector commands.

${RIPSCRIP_REFERENCE}

CONVERSION RULES:
1. Identify main shapes, lines, and regions in the image
2. Map colors to the nearest EGA palette color
3. Use geometric primitives (lines, rectangles, circles, polylines) to approximate the image
4. Output ONLY valid RIPscrip commands, no explanations
5. Start with |* to reset, then build up the image
6. Complexity level: ${complexity}% - ${complexity < 30 ? 'capture only major shapes' : complexity < 70 ? 'moderate detail' : 'include fine details'}
7. Palette: ${palette === 'ega16' ? 'Full 16 colors' : palette === 'cga4' ? 'CGA 4-color' : 'Monochrome'}
8. Target resolution: 640x350

Create a faithful vector representation of the image in the retro BBS style.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              },
              { text: 'Convert this image to RIPscrip vector commands.' }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0, // Required for thinking
          maxOutputTokens: 16384,
          thinkingConfig: {
            thinkingBudget: 4096, // More thinking for image analysis
          }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Image vectorization failed' },
        { status: 500 }
      );
    }

    const data = await response.json();
    let ripscrip = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up
    ripscrip = ripscrip
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .trim();

    if (!ripscrip.startsWith('|*')) {
      ripscrip = '|*\n' + ripscrip;
    }

    return NextResponse.json({ ripscrip });
  } catch (error) {
    console.error('Vectorization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
