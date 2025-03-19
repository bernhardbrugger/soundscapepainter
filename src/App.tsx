import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Paintbrush, 
  Play, 
  Square, 
  Pause, 
  Save,
  Eraser,
  Volume2,
  Waves,
  Palette,
  RefreshCw,
  Download
} from 'lucide-react';

type Point = {
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: number;
};

type Stroke = {
  points: Point[];
  color: string;
  instrument: string;
};

const instruments = [
  { name: 'Synth Waves', color: '#FF6B6B', baseNote: 60 },
  { name: 'Cosmic Bells', color: '#4ECDC4', baseNote: 72 },
  { name: 'Dream Strings', color: '#45B7D1', baseNote: 48 },
  { name: 'Star Chimes', color: '#96CEB4', baseNote: 84 },
  { name: 'Nebula Pads', color: '#FFEEAD', baseNote: 36 }
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Initial canvas style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw existing strokes
    drawStrokes();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const drawStrokes = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    [...strokes, { points: currentStroke, color: selectedInstrument.color }].forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = p1.size;
        ctx.lineTo(p1.x, p1.y);
      }
      
      ctx.stroke();
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentStroke([{ 
      x, 
      y, 
      color: selectedInstrument.color,
      size: 2 + (y / rect.height) * 8,
      velocity: 0.5 + (x / rect.width) * 0.5
    }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentStroke(prev => [...prev, {
      x,
      y,
      color: selectedInstrument.color,
      size: 2 + (y / rect.height) * 8,
      velocity: 0.5 + (x / rect.width) * 0.5
    }]);
    
    drawStrokes();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStrokes(prev => [...prev, {
      points: currentStroke,
      color: selectedInstrument.color,
      instrument: selectedInstrument.name
    }]);
    setCurrentStroke([]);
  };

  const playSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    setIsPlaying(true);
    let startTime = audioContextRef.current.currentTime;
    
    const playStroke = (stroke: Stroke) => {
      const oscillator = audioContextRef.current!.createOscillator();
      const gainNode = audioContextRef.current!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current!.destination);
      
      stroke.points.forEach((point, i) => {
        const frequency = 220 + (point.y / canvasRef.current!.height) * 880;
        const time = startTime + (i * 0.05);
        
        oscillator.frequency.setValueAtTime(frequency, time);
        gainNode.gain.setValueAtTime(point.velocity * volume, time);
      });
      
      oscillator.start(startTime);
      oscillator.stop(startTime + stroke.points.length * 0.05);
      
      startTime += stroke.points.length * 0.05;
    };
    
    strokes.forEach(playStroke);
  };

  const stopSound = () => {
    setIsPlaying(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = undefined;
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
    drawStrokes();
    stopSound();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-12 h-12 text-purple-300" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
            Soundscape Painter
          </h1>
          <p className="text-purple-200">
            Paint with gestures to create unique musical compositions
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-lg rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {instruments.map(inst => (
                  <button
                    key={inst.name}
                    onClick={() => setSelectedInstrument(inst)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedInstrument.name === inst.name
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-purple-200 hover:bg-white/10'
                    }`}
                    style={{ borderLeft: `4px solid ${inst.color}` }}
                  >
                    <Waves className="w-4 h-4" />
                    {inst.name}
                  </button>
                ))}
              </div>
              
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-[400px] rounded-lg bg-black/30 cursor-crosshair"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? stopSound : playSound}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Stop' : 'Play'}
              </button>
              
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Clear
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-purple-300" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        </div>

        <div className="text-center text-purple-200 text-sm">
          <p>Draw on the canvas to create musical patterns. Each vertical position determines pitch,</p>
          <p>horizontal position affects velocity, and stroke thickness influences volume.</p>
        </div>
      </div>
    </div>
  );
}

export default App;