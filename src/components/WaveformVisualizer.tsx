import { useEffect, useRef } from "react";
import { AudioService } from "../services/audioStreamer";

interface WaveformVisualizerProps {
  audioService: AudioService | null;
  state: "disconnected" | "idle" | "connecting" | "listening" | "speaking";
  style?: "pulse" | "line" | "bars";
  uiTheme?: "rose" | "sassy";
}

export default function WaveformVisualizer({ audioService, state, style = "line", uiTheme = "rose" }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const dataArray = new Uint8Array(128);

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += 0.04;
      const phase = phaseRef.current;
      const centerY = height / 2;
      const centerX = width / 2;

      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      const isSassy = uiTheme === "sassy";

      if (state === "disconnected") {
        if (style === "bars") {
          // Draw faint resting analyzer bars
          const numBars = 24;
          const barWidth = 4;
          const barGap = 6;
          const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
          const startX = (width - totalWidth) / 2;
          ctx.fillStyle = isSassy ? "rgba(168, 85, 247, 0.15)" : "rgba(244, 63, 94, 0.15)";
          for (let i = 0; i < numBars; i++) {
            const x = startX + i * (barWidth + barGap);
            ctx.beginPath();
            if ("roundRect" in ctx) {
              (ctx as any).roundRect(x, centerY - 2, barWidth, 4, 2);
            } else {
              ctx.rect(x, centerY - 2, barWidth, 4);
            }
            ctx.fill();
          }
        } else if (style === "pulse") {
          // Draw faint circular ring
          ctx.strokeStyle = isSassy ? "rgba(168, 85, 247, 0.15)" : "rgba(244, 63, 94, 0.15)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.min(width, height) * 0.28, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Draw a flat line with slight noise
          ctx.strokeStyle = isSassy ? "rgba(168, 85, 247, 0.2)" : "rgba(244, 63, 94, 0.2)"; // Muted Purple vs Muted Rose
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(width, centerY);
          ctx.stroke();
        }

      } else if (state === "connecting") {
        // Draw multiple glowing pulsating concentric circles/ripples in center (always cool!)
        const maxRadius = Math.min(width, height) * 0.4;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const progress = ((phase * 0.3 + i / count) % 1);
          const radius = maxRadius * progress;
          const alpha = 1 - progress;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isSassy ? `rgba(168, 85, 247, ${alpha * 0.8})` : `rgba(244, 63, 94, ${alpha * 0.8})`; // Purple vs Rose
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(244, 63, 94, 0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
        }

      } else if (state === "idle") {
        if (style === "bars") {
          // Gentle bouncing spectrum analyzer bars
          const numBars = 24;
          const barWidth = 5;
          const barGap = 6;
          const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
          const startX = (width - totalWidth) / 2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = isSassy ? "rgba(245, 158, 11, 0.5)" : "rgba(236, 72, 153, 0.5)";
          
          for (let i = 0; i < numBars; i++) {
            const x = startX + i * (barWidth + barGap);
            const amp = 6 + Math.sin(phase * 1.5 + i * 0.4) * 4;
            ctx.fillStyle = i % 2 === 0 
              ? (isSassy ? "rgba(168, 85, 247, 0.6)" : "rgba(244, 63, 94, 0.6)") 
              : (isSassy ? "rgba(245, 158, 11, 0.6)" : "rgba(236, 72, 153, 0.6)");
            ctx.beginPath();
            if ("roundRect" in ctx) {
              (ctx as any).roundRect(x, centerY - amp / 2, barWidth, amp, 2.5);
            } else {
              ctx.rect(x, centerY - amp / 2, barWidth, amp);
            }
            ctx.fill();
          }
          ctx.shadowBlur = 0;

        } else if (style === "pulse") {
          // Slow breathing circle
          ctx.shadowBlur = 10;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.6)" : "rgba(244, 63, 94, 0.6)";
          const baseRadius = Math.min(width, height) * 0.26;
          
          const layers = [
            { scale: 1 + Math.sin(phase * 1.2) * 0.05, color: isSassy ? "rgba(168, 85, 247, 0.65)" : "rgba(244, 63, 94, 0.65)", width: 3 },
            { scale: 0.9 + Math.sin(phase * 1.2 + Math.PI / 2) * 0.04, color: isSassy ? "rgba(245, 158, 11, 0.45)" : "rgba(236, 72, 153, 0.45)", width: 2 },
            { scale: 1.1 + Math.sin(phase * 0.8) * 0.06, color: isSassy ? "rgba(234, 179, 8, 0.25)" : "rgba(217, 70, 239, 0.25)", width: 1.5 }
          ];

          layers.forEach((layer) => {
            ctx.strokeStyle = layer.color;
            ctx.lineWidth = layer.width;
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius * layer.scale, 0, Math.PI * 2);
            ctx.stroke();
          });
          ctx.shadowBlur = 0;

        } else {
          // Slow elegant resting sine wave
          ctx.shadowBlur = 10;
          ctx.shadowColor = isSassy ? "rgba(245, 158, 11, 0.6)" : "rgba(236, 72, 153, 0.6)"; // gold/pink glow

          // Draw three offset sine waves for layered look
          const waveColors = isSassy ? [
            "rgba(168, 85, 247, 0.7)", // Purple
            "rgba(245, 158, 11, 0.5)", // Gold
            "rgba(234, 179, 8, 0.3)"  // Yellow
          ] : [
            "rgba(244, 63, 94, 0.7)", // Rose
            "rgba(236, 72, 153, 0.5)", // Pink
            "rgba(217, 70, 239, 0.3)"  // Fuchsia
          ];

          waveColors.forEach((color, index) => {
            ctx.strokeStyle = color;
            ctx.beginPath();
            const speedFactor = 1 + index * 0.2;
            const amplitude = 12 - index * 3;
            const frequency = 0.01 + index * 0.005;

            for (let x = 0; x < width; x++) {
              const y =
                centerY +
                Math.sin(x * frequency + phase * speedFactor) *
                  amplitude *
                  Math.sin(phase * 0.2);
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          });
          
          ctx.shadowBlur = 0;
        }

      } else if (state === "listening") {
        if (audioService) {
          audioService.getWaveformData("input", dataArray);
        }

        if (style === "bars") {
          // Equalizer bars responding to user microphone
          const numBars = 32;
          const barWidth = 4;
          const barGap = 4;
          const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
          const startX = (width - totalWidth) / 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.7)" : "rgba(236, 72, 153, 0.7)";
          
          const pointsPerBar = Math.floor(dataArray.length / numBars) || 1;
          for (let i = 0; i < numBars; i++) {
            const x = startX + i * (barWidth + barGap);
            let sum = 0;
            for (let j = 0; j < pointsPerBar; j++) {
              sum += dataArray[i * pointsPerBar + j];
            }
            const avg = sum / pointsPerBar;
            const v = avg / 128.0;
            const amp = Math.max(4, Math.abs(v - 1.0) * (height * 1.1));
            
            ctx.fillStyle = isSassy 
              ? `rgba(168, 85, 247, ${0.4 + (amp / height) * 0.6})` 
              : `rgba(236, 72, 153, ${0.4 + (amp / height) * 0.6})`;
            ctx.beginPath();
            if ("roundRect" in ctx) {
              (ctx as any).roundRect(x, centerY - amp / 2, barWidth, amp, 2);
            } else {
              ctx.rect(x, centerY - amp / 2, barWidth, amp);
            }
            ctx.fill();
          }
          ctx.shadowBlur = 0;

        } else if (style === "pulse") {
          // Reactive user voice circular ring
          ctx.shadowBlur = 12;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(236, 72, 153, 0.8)";
          const baseRadius = Math.min(width, height) * 0.28;
          const numPoints = 80;
          
          const ringConfigs = isSassy ? [
            { color: "rgba(168, 85, 247, 0.85)", multiplier: 1.0, width: 3 },
            { color: "rgba(245, 158, 11, 0.4)", multiplier: 0.7, width: 1.5, invert: true }
          ] : [
            { color: "rgba(236, 72, 153, 0.85)", multiplier: 1.0, width: 3 },
            { color: "rgba(217, 70, 239, 0.4)", multiplier: 0.7, width: 1.5, invert: true }
          ];

          ringConfigs.forEach((config) => {
            ctx.strokeStyle = config.color;
            ctx.lineWidth = config.width;
            ctx.beginPath();
            
            for (let i = 0; i <= numPoints; i++) {
              const theta = (i / numPoints) * Math.PI * 2;
              const dataIdx = Math.floor((i % numPoints) * (dataArray.length / numPoints));
              const v = dataArray[dataIdx] / 128.0;
              const rawOffset = (v - 1.0) * (height * 0.4);
              const amp = rawOffset * config.multiplier * (config.invert ? -1 : 1);
              
              const r = baseRadius + amp;
              const x = centerX + Math.cos(theta) * r;
              const y = centerY + Math.sin(theta) * r;
              
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          });
          ctx.shadowBlur = 0;

        } else {
          // Reactive user mic visualization (Line style)
          ctx.strokeStyle = isSassy ? "rgba(168, 85, 247, 0.95)" : "rgba(236, 72, 153, 0.95)"; // Purple vs Neon Pink
          ctx.shadowBlur = 12;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(236, 72, 153, 0.8)";
          
          ctx.beginPath();
          const sliceWidth = width / dataArray.length;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const offset = (v - 1.0) * (height * 0.45); // Scale amplitude
            const y = centerY + offset;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }
          ctx.lineTo(width, centerY);
          ctx.stroke();
          
          ctx.shadowBlur = 0;
        }

      } else if (state === "speaking") {
        if (audioService) {
          audioService.getWaveformData("output", dataArray);
        }

        if (style === "bars") {
          // Spectrum analyzer speaking bars
          const numBars = 36;
          const barWidth = 4;
          const barGap = 3;
          const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
          const startX = (width - totalWidth) / 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(244, 63, 94, 0.8)";
          
          const pointsPerBar = Math.floor(dataArray.length / numBars) || 1;
          for (let i = 0; i < numBars; i++) {
            const x = startX + i * (barWidth + barGap);
            let sum = 0;
            for (let j = 0; j < pointsPerBar; j++) {
              sum += dataArray[i * pointsPerBar + j];
            }
            const avg = sum / pointsPerBar;
            const v = avg / 128.0;
            const amp = Math.max(4, Math.abs(v - 1.0) * (height * 1.5));
            
            ctx.fillStyle = isSassy 
              ? `rgba(245, 158, 11, ${0.4 + (amp / height) * 0.6})` 
              : `rgba(244, 63, 94, ${0.4 + (amp / height) * 0.6})`;
            ctx.beginPath();
            if ("roundRect" in ctx) {
              (ctx as any).roundRect(x, centerY - amp / 2, barWidth, amp, 2);
            } else {
              ctx.rect(x, centerY - amp / 2, barWidth, amp);
            }
            ctx.fill();
          }
          ctx.shadowBlur = 0;

        } else if (style === "pulse") {
          // Reactive speaking circular ring waves
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(244, 63, 94, 0.8)";
          const baseRadius = Math.min(width, height) * 0.28;
          const numPoints = 90;
          
          const ringConfigs = isSassy ? [
            { color: "rgba(168, 85, 247, 0.9)", multiplier: 1.3, width: 3.5 },
            { color: "rgba(245, 158, 11, 0.45)", multiplier: 0.85, width: 2, invert: true }
          ] : [
            { color: "rgba(244, 63, 94, 0.9)", multiplier: 1.3, width: 3.5 },
            { color: "rgba(217, 70, 239, 0.45)", multiplier: 0.85, width: 2, invert: true }
          ];

          ringConfigs.forEach((config) => {
            ctx.strokeStyle = config.color;
            ctx.lineWidth = config.width;
            ctx.beginPath();
            
            for (let i = 0; i <= numPoints; i++) {
              const theta = (i / numPoints) * Math.PI * 2;
              const dataIdx = Math.floor((i % numPoints) * (dataArray.length / numPoints));
              const v = dataArray[dataIdx] / 128.0;
              const rawOffset = (v - 1.0) * (height * 0.4);
              const amp = rawOffset * config.multiplier * (config.invert ? -1 : 1);
              
              const r = baseRadius + amp;
              const x = centerX + Math.cos(theta) * r;
              const y = centerY + Math.sin(theta) * r;
              
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          });
          ctx.shadowBlur = 0;

        } else {
          // Hot reactive speaker visualization (multiple glowing frequency curves - Line style)
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSassy ? "rgba(168, 85, 247, 0.8)" : "rgba(244, 63, 94, 0.8)"; // Neon Purple/Rose
          
          ctx.strokeStyle = isSassy ? "rgba(168, 85, 247, 0.95)" : "rgba(244, 63, 94, 0.95)";
          ctx.beginPath();
          const sliceWidth = width / dataArray.length;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const offset = (v - 1.0) * (height * 0.45);
            
            const ampOffset = offset * 1.5;
            const y = centerY + ampOffset;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }
          ctx.stroke();

          // Draw a second softer glowing mirrored curve
          ctx.strokeStyle = isSassy ? "rgba(245, 158, 11, 0.4)" : "rgba(217, 70, 239, 0.4)"; // Gold vs Fuchsia
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const offset = (v - 1.0) * (height * 0.3);
            const y = centerY - offset; // inverted

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }
          ctx.stroke();

          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioService, state]);

  return (
    <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        id="waveform-canvas"
        className="w-full h-full max-w-2xl"
      />
    </div>
  );
}
