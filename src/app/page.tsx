'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RipPreview } from '@/components/rip-preview';
import { Download, Loader2, Moon, Sun, Upload } from 'lucide-react';

// EGA 16-color palette
const EGA_COLORS = [
  '#000000', '#0000AA', '#00AA00', '#00AAAA',
  '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF',
  '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [ripscripCode, setRipscripCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [complexity, setComplexity] = useState([50]);
  const [resolution, setResolution] = useState('640x350');
  const [palette, setPalette] = useState('ega16');
  const [interactive, setInteractive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
          complexity: complexity[0],
          resolution,
          palette,
          interactive,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('complexity', complexity[0].toString());
      formData.append('palette', palette);
      
      const res = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Vectorization failed');
      }
      
      const data = await res.json();
      setRipscripCode(data.ripscrip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const [width, height] = resolution.split('x').map(Number);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              RIPscrip AI Studio
            </h1>
            <p className="text-sm text-gray-400">
              AI-powered revival of 1990s BBS graphics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-gray-400" />
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
            <Moon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Settings */}
          <aside className="lg:col-span-1 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color Palette */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Color Palette</Label>
                  <Select value={palette} onValueChange={setPalette}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ega16">16 EGA Colors</SelectItem>
                      <SelectItem value="cga4">4 CGA Colors</SelectItem>
                      <SelectItem value="mono">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Color Preview */}
                  <div className="grid grid-cols-8 gap-1 mt-2">
                    {EGA_COLORS.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded border border-gray-600"
                        style={{ backgroundColor: color }}
                        title={`Color ${i}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Complexity */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Complexity: {complexity[0]}%
                  </Label>
                  <Slider
                    value={complexity}
                    onValueChange={setComplexity}
                    max={100}
                    step={10}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Resolution */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="640x350">640×350 (EGA)</SelectItem>
                      <SelectItem value="640x480">640×480 (VGA)</SelectItem>
                      <SelectItem value="320x200">320×200 (CGA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Interactive Elements */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interactive"
                    checked={interactive}
                    onCheckedChange={(checked) => setInteractive(checked as boolean)}
                  />
                  <Label htmlFor="interactive" className="text-gray-300">
                    Include buttons/hotspots
                  </Label>
                </div>

                {/* Image Upload */}
                <div className="pt-4 border-t border-gray-700">
                  <Label className="text-gray-300 mb-2 block">
                    Or vectorize an image
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Prompt Input */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="A cyberpunk cityscape in EGA colors with neon signs and hovering cars..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate RIPscrip'
                    )}
                  </Button>
                  
                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview Pane */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <RipPreview
                  code={ripscripCode}
                  width={width}
                  height={height}
                  isLoading={isGenerating}
                />
              </CardContent>
            </Card>

            {/* Code Output */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">RIPscrip Code</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!ripscripCode}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download .rip
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-auto max-h-[300px] text-sm font-mono text-green-400">
                  {ripscripCode || '// Generated RIPscrip code will appear here...'}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>RIPscrip AI Studio • Powered by Gemini AI</p>
          <p className="mt-1">
            <a href="https://16colo.rs/tags/content/ripscrip" className="text-blue-400 hover:underline" target="_blank" rel="noopener">
              Browse classic RIP art at 16colors
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
