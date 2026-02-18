'use client';

import { useEffect, useRef, useState } from 'react';
// Retro loading - no external icons needed

// EGA 16-color palette
const EGA_PALETTE = [
  '#000000', '#0000AA', '#00AA00', '#00AAAA',
  '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF',
  '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF',
];

interface RipPreviewProps {
  code: string;
  width: number;
  height: number;
  isLoading?: boolean;
}

export function RipPreview({ code, width, height, isLoading }: RipPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderProgress, setRenderProgress] = useState(0);

  useEffect(() => {
    if (!code || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with black background
    ctx.fillStyle = EGA_PALETTE[0];
    ctx.fillRect(0, 0, width, height);

    // Parse and render RIPscrip commands with animation
    const commands = parseRIPscrip(code);
    let currentCommand = 0;

    const renderStep = () => {
      if (currentCommand >= commands.length) {
        setRenderProgress(100);
        return;
      }

      const cmd = commands[currentCommand];
      executeCommand(ctx, cmd);
      currentCommand++;
      setRenderProgress(Math.floor((currentCommand / commands.length) * 100));

      // Animate drawing - faster for simple commands
      const delay = cmd.type === 'pixel' ? 1 : 20;
      setTimeout(renderStep, delay);
    };

    setRenderProgress(0);
    renderStep();
  }, [code, width, height]);

  // Scale canvas for crisp rendering while maintaining aspect ratio
  const aspectRatio = width / height;
  const displayWidth = Math.min(640, width);
  const displayHeight = displayWidth / aspectRatio;

  return (
    <div className="relative">
      <div 
        className="border-2 border-green-800 overflow-hidden bg-black mx-auto relative"
        style={{ 
          width: displayWidth, 
          maxWidth: '100%',
          aspectRatio: `${width}/${height}`,
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.1)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 font-mono">
            <div className="text-center text-green-400">
              <pre className="animate-pulse">
{`╔═══════════════════╗
║  CONNECTING...    ║
║  ████████░░░░ 67% ║
║  RENDERING RIP    ║
╚═══════════════════╝`}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar for rendering - retro style */}
      {code && renderProgress < 100 && !isLoading && (
        <div className="mt-2 font-mono text-xs text-green-400">
          <div className="flex items-center gap-2">
            <span>DRAW:</span>
            <span className="text-cyan-400">
              {'█'.repeat(Math.floor(renderProgress / 5))}
              {'░'.repeat(20 - Math.floor(renderProgress / 5))}
            </span>
            <span>{renderProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// RIPscrip command types
interface RipCommand {
  type: string;
  params: Record<string, unknown>;
}

// Current drawing state
let drawState = {
  fgColor: 15,
  bgColor: 0,
  lineStyle: 0,
  fillStyle: 1,
  fillColor: 15,
  x: 0,
  y: 0,
};

function resetDrawState() {
  drawState = {
    fgColor: 15,
    bgColor: 0,
    lineStyle: 0,
    fillStyle: 1,
    fillColor: 15,
    x: 0,
    y: 0,
  };
}

// Parse RIPscrip code into commands
function parseRIPscrip(code: string): RipCommand[] {
  const commands: RipCommand[] = [];
  resetDrawState();

  // RIPscrip commands start with '|' (or '!' in some variants)
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    
    // Each command is |<cmd><params>
    let i = 0;
    while (i < trimmed.length) {
      if (trimmed[i] === '|' || trimmed[i] === '!') {
        i++;
        if (i >= trimmed.length) break;
        
        const cmd = trimmed[i];
        i++;
        
        // Parse parameters based on command
        const parsed = parseCommand(cmd, trimmed.slice(i));
        if (parsed) {
          commands.push(parsed.command);
          i += parsed.consumed;
        }
      } else {
        i++;
      }
    }
  }

  return commands;
}

// Base36 decode (used for coordinates in RIPscrip)
function base36Decode(chars: string): number {
  let result = 0;
  for (const char of chars) {
    result *= 36;
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      result += code - 48; // 0-9
    } else if (code >= 65 && code <= 90) {
      result += code - 55; // A-Z = 10-35
    } else if (code >= 97 && code <= 122) {
      result += code - 87; // a-z = 10-35
    }
  }
  return result;
}

// Parse a single RIPscrip command
function parseCommand(cmd: string, params: string): { command: RipCommand; consumed: number } | null {
  switch (cmd) {
    case 'c': // Color
      if (params.length >= 2) {
        const fg = base36Decode(params[0]);
        const bg = base36Decode(params[1]);
        drawState.fgColor = fg;
        drawState.bgColor = bg;
        return { command: { type: 'color', params: { fg, bg } }, consumed: 2 };
      }
      break;
      
    case 'L': // Line
      if (params.length >= 8) {
        const x0 = base36Decode(params.slice(0, 2));
        const y0 = base36Decode(params.slice(2, 4));
        const x1 = base36Decode(params.slice(4, 6));
        const y1 = base36Decode(params.slice(6, 8));
        return { 
          command: { type: 'line', params: { x0, y0, x1, y1, color: drawState.fgColor } }, 
          consumed: 8 
        };
      }
      break;
      
    case 'R': // Rectangle
      if (params.length >= 8) {
        const x0 = base36Decode(params.slice(0, 2));
        const y0 = base36Decode(params.slice(2, 4));
        const x1 = base36Decode(params.slice(4, 6));
        const y1 = base36Decode(params.slice(6, 8));
        return { 
          command: { type: 'rect', params: { x0, y0, x1, y1, color: drawState.fgColor } }, 
          consumed: 8 
        };
      }
      break;
      
    case 'B': // Filled Rectangle (Bar)
      if (params.length >= 8) {
        const x0 = base36Decode(params.slice(0, 2));
        const y0 = base36Decode(params.slice(2, 4));
        const x1 = base36Decode(params.slice(4, 6));
        const y1 = base36Decode(params.slice(6, 8));
        return { 
          command: { type: 'fillRect', params: { x0, y0, x1, y1, color: drawState.fgColor } }, 
          consumed: 8 
        };
      }
      break;
      
    case 'C': // Circle
      if (params.length >= 6) {
        const cx = base36Decode(params.slice(0, 2));
        const cy = base36Decode(params.slice(2, 4));
        const r = base36Decode(params.slice(4, 6));
        return { 
          command: { type: 'circle', params: { cx, cy, r, color: drawState.fgColor } }, 
          consumed: 6 
        };
      }
      break;
      
    case 'O': // Oval/Ellipse
      if (params.length >= 10) {
        const cx = base36Decode(params.slice(0, 2));
        const cy = base36Decode(params.slice(2, 4));
        const sa = base36Decode(params.slice(4, 6)); // start angle
        const ea = base36Decode(params.slice(6, 8)); // end angle
        const rx = base36Decode(params.slice(8, 10));
        const ry = params.length >= 12 ? base36Decode(params.slice(10, 12)) : rx;
        return { 
          command: { type: 'oval', params: { cx, cy, rx, ry, sa, ea, color: drawState.fgColor } }, 
          consumed: Math.min(12, params.length) 
        };
      }
      break;
      
    case 'X': // Pixel
      if (params.length >= 4) {
        const x = base36Decode(params.slice(0, 2));
        const y = base36Decode(params.slice(2, 4));
        return { 
          command: { type: 'pixel', params: { x, y, color: drawState.fgColor } }, 
          consumed: 4 
        };
      }
      break;
      
    case 'm': // Move to
      if (params.length >= 4) {
        const x = base36Decode(params.slice(0, 2));
        const y = base36Decode(params.slice(2, 4));
        drawState.x = x;
        drawState.y = y;
        return { command: { type: 'moveTo', params: { x, y } }, consumed: 4 };
      }
      break;
      
    case 'l': // Line to (from current position)
      if (params.length >= 4) {
        const x = base36Decode(params.slice(0, 2));
        const y = base36Decode(params.slice(2, 4));
        const cmd: RipCommand = { 
          type: 'lineTo', 
          params: { x0: drawState.x, y0: drawState.y, x1: x, y1: y, color: drawState.fgColor } 
        };
        drawState.x = x;
        drawState.y = y;
        return { command: cmd, consumed: 4 };
      }
      break;
      
    case 'P': // Polyline
      {
        // Parse count then coordinates
        const count = base36Decode(params.slice(0, 2));
        const points: { x: number; y: number }[] = [];
        let offset = 2;
        for (let i = 0; i < count && offset + 4 <= params.length; i++) {
          points.push({
            x: base36Decode(params.slice(offset, offset + 2)),
            y: base36Decode(params.slice(offset + 2, offset + 4))
          });
          offset += 4;
        }
        return { 
          command: { type: 'polyline', params: { points, color: drawState.fgColor } }, 
          consumed: offset 
        };
      }
      
    case 'S': // Fill style
      if (params.length >= 2) {
        const style = base36Decode(params[0]);
        const color = base36Decode(params[1]);
        drawState.fillStyle = style;
        drawState.fillColor = color;
        return { command: { type: 'fillStyle', params: { style, color } }, consumed: 2 };
      }
      break;
      
    case 'F': // Flood fill
      if (params.length >= 5) {
        const x = base36Decode(params.slice(0, 2));
        const y = base36Decode(params.slice(2, 4));
        const border = base36Decode(params[4]);
        return { 
          command: { type: 'floodFill', params: { x, y, border, fillColor: drawState.fillColor } }, 
          consumed: 5 
        };
      }
      break;
      
    case '*': // Reset window
      resetDrawState();
      return { command: { type: 'reset', params: {} }, consumed: 0 };
      
    case 'w': // Define text window
      if (params.length >= 8) {
        return { command: { type: 'textWindow', params: {} }, consumed: 8 };
      }
      break;
  }
  
  return null;
}

// Execute a RIPscrip command on canvas
function executeCommand(ctx: CanvasRenderingContext2D, cmd: RipCommand) {
  const p = cmd.params;
  
  switch (cmd.type) {
    case 'color':
      // State already updated during parsing
      break;
      
    case 'line':
    case 'lineTo':
      ctx.strokeStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x0 as number, p.y0 as number);
      ctx.lineTo(p.x1 as number, p.y1 as number);
      ctx.stroke();
      break;
      
    case 'rect':
      ctx.strokeStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.lineWidth = 1;
      ctx.strokeRect(
        p.x0 as number, 
        p.y0 as number, 
        (p.x1 as number) - (p.x0 as number), 
        (p.y1 as number) - (p.y0 as number)
      );
      break;
      
    case 'fillRect':
      ctx.fillStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.fillRect(
        p.x0 as number, 
        p.y0 as number, 
        (p.x1 as number) - (p.x0 as number), 
        (p.y1 as number) - (p.y0 as number)
      );
      break;
      
    case 'circle':
      ctx.strokeStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.cx as number, p.cy as number, p.r as number, 0, Math.PI * 2);
      ctx.stroke();
      break;
      
    case 'oval':
      ctx.strokeStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        p.cx as number, 
        p.cy as number, 
        p.rx as number, 
        p.ry as number, 
        0, 
        0, 
        Math.PI * 2
      );
      ctx.stroke();
      break;
      
    case 'pixel':
      ctx.fillStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.fillRect(p.x as number, p.y as number, 1, 1);
      break;
      
    case 'polyline':
      const points = p.points as { x: number; y: number }[];
      if (points.length < 2) break;
      ctx.strokeStyle = EGA_PALETTE[p.color as number] || EGA_PALETTE[15];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      break;
      
    case 'floodFill':
      // Simple flood fill - for complex patterns we'd need more sophisticated approach
      floodFill(
        ctx, 
        p.x as number, 
        p.y as number, 
        EGA_PALETTE[p.fillColor as number] || EGA_PALETTE[15]
      );
      break;
      
    case 'reset':
      ctx.fillStyle = EGA_PALETTE[0];
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      break;
  }
}

// Simple flood fill implementation
function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Parse fill color
  const fill = hexToRgb(fillColor);
  if (!fill) return;
  
  // Get target color at start position
  const startIdx = (startY * canvas.width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  
  // Don't fill if already the fill color
  if (targetR === fill.r && targetG === fill.g && targetB === fill.b) return;
  
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<number>();
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = (y * canvas.width + x) * 4;
    const key = y * canvas.width + x;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
    
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if this pixel matches target color
    if (Math.abs(r - targetR) > 1 || Math.abs(g - targetG) > 1 || Math.abs(b - targetB) > 1) continue;
    
    visited.add(key);
    
    // Fill pixel
    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;
    
    // Add neighbors (limit stack depth to prevent crashes on large areas)
    if (stack.length < 100000) {
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
