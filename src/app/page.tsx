'use client';

import { useState } from 'react';
import { RipPreview } from '@/components/rip-preview';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [ripscripCode, setRipscripCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          complexity: 70,
          resolution: '640x350',
          palette: 'ega16',
          interactive: false,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Generation failed');
      }
      
      const data = await res.json();
      setRipscripCode(data.ripscrip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!ripscripCode) return;
    const blob = new Blob([ripscripCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.rip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8">
      {/* ASCII Header */}
      <header className="mb-8 text-center">
        <pre className="text-cyan-400 text-xs md:text-sm inline-block text-left">
{`
╔══════════════════════════════════════════════════════════════╗
║  ██████╗ ██╗██████╗ ███████╗ ██████╗██████╗ ██╗██████╗       ║
║  ██╔══██╗██║██╔══██╗██╔════╝██╔════╝██╔══██╗██║██╔══██╗      ║
║  ██████╔╝██║██████╔╝███████╗██║     ██████╔╝██║██████╔╝      ║
║  ██╔══██╗██║██╔═══╝ ╚════██║██║     ██╔══██╗██║██╔═══╝       ║
║  ██║  ██║██║██║     ███████║╚██████╗██║  ██║██║██║           ║
║  ╚═╝  ╚═╝╚═╝╚═╝     ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝           ║
║                      ▄▀▄ ▀ █▀▀▄ ▀█▀ ▄▀▀▄                     ║
║                      █▀█ █ ▀▀▄   █  █  █                     ║
║                      ▀ ▀ ▀ ▀▀▀  ▀▀▀  ▀▀                      ║
╚══════════════════════════════════════════════════════════════╝`}
        </pre>
        <p className="text-gray-500 mt-2 text-sm">
          [ AI-Powered BBS Vector Graphics Generator ]
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Input Section */}
        <div className="border border-green-800 bg-black p-4">
          <div className="text-yellow-400 mb-2">
            ┌─ DESCRIBE YOUR SCENE ─────────────────────────────────────┐
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="A neon-lit cyberpunk alley with rain and holographic signs..."
            className="w-full bg-black text-green-400 border border-green-800 p-3 
                       focus:border-cyan-400 focus:outline-none resize-none h-24
                       placeholder:text-green-900"
            disabled={isGenerating}
          />
          <div className="text-yellow-400 mt-2">
            └───────────────────────────────────────── [ENTER] to generate ─┘
          </div>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2 bg-blue-900 text-cyan-400 border border-cyan-400
                         hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isGenerating ? '[ GENERATING... ]' : '[ GENERATE ]'}
            </button>
            
            {ripscripCode && (
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-green-900 text-green-400 border border-green-400
                           hover:bg-green-800 transition-colors"
              >
                [ DOWNLOAD .RIP ]
              </button>
            )}
          </div>
          
          {error && (
            <div className="mt-4 text-red-400 border border-red-800 p-2">
              ERROR: {error}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="border border-green-800 bg-black p-4">
          <div className="text-yellow-400 mb-4">
            ┌─ PREVIEW ─────────────────────────────────────────────────┐
          </div>
          
          <div className="flex justify-center">
            <RipPreview
              code={ripscripCode}
              width={640}
              height={350}
              isLoading={isGenerating}
            />
          </div>
          
          <div className="text-yellow-400 mt-4">
            └─────────────────────────────────────────────── 640×350 EGA ─┘
          </div>
        </div>

        {/* Code Section */}
        {ripscripCode && (
          <div className="border border-green-800 bg-black p-4">
            <div className="text-yellow-400 mb-2">
              ┌─ RIPSCRIP CODE ─────────────────────────────────────────┐
            </div>
            <pre className="bg-gray-950 border border-green-900 p-4 overflow-auto 
                           max-h-48 text-xs text-green-500 whitespace-pre-wrap">
              {ripscripCode}
            </pre>
            <div className="text-yellow-400 mt-2">
              └────────────────────────────── {ripscripCode.length} bytes ─┘
            </div>
          </div>
        )}

        {/* Color Palette Reference */}
        <div className="border border-green-800 bg-black p-4">
          <div className="text-yellow-400 mb-2">
            ┌─ EGA PALETTE ─────────────────────────────────────────────┐
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { n: '0', c: '#000000', l: 'BLK' },
              { n: '1', c: '#0000AA', l: 'BLU' },
              { n: '2', c: '#00AA00', l: 'GRN' },
              { n: '3', c: '#00AAAA', l: 'CYN' },
              { n: '4', c: '#AA0000', l: 'RED' },
              { n: '5', c: '#AA00AA', l: 'MAG' },
              { n: '6', c: '#AA5500', l: 'BRN' },
              { n: '7', c: '#AAAAAA', l: 'GRY' },
              { n: '8', c: '#555555', l: 'DGR' },
              { n: '9', c: '#5555FF', l: 'LBL' },
              { n: 'A', c: '#55FF55', l: 'LGR' },
              { n: 'B', c: '#55FFFF', l: 'LCY' },
              { n: 'C', c: '#FF5555', l: 'LRD' },
              { n: 'D', c: '#FF55FF', l: 'LMG' },
              { n: 'E', c: '#FFFF55', l: 'YEL' },
              { n: 'F', c: '#FFFFFF', l: 'WHT' },
            ].map(({ n, c, l }) => (
              <div key={n} className="flex items-center gap-1 text-xs">
                <div 
                  className="w-4 h-4 border border-gray-600" 
                  style={{ backgroundColor: c }}
                />
                <span className="text-gray-500">{n}:{l}</span>
              </div>
            ))}
          </div>
          <div className="text-yellow-400 mt-2">
            └───────────────────────────────────────────────────────────┘
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 text-xs">
        <pre>
{`═══════════════════════════════════════════════════════════════
  Powered by Gemini 3 Flash │ Inspired by RIPterm circa 1993
  ─────────────────────────────────────────────────────────────
  Before the Web, there was the BBS...
═══════════════════════════════════════════════════════════════`}
        </pre>
      </footer>
    </div>
  );
}
