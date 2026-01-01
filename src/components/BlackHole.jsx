import { useEffect, useRef } from 'react';
import './BlackHole.css';

const BlackHole = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 4000);
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.3,
          brightness: Math.random() * 0.5 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawStars = () => {
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
    };

    const drawGargantua = () => {
      // Position black hole on the right side
      const centerX = canvas.width * 0.72;
      const centerY = canvas.height * 0.5;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.32;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      
      // Outer glow / ambient light
      const ambientGlow = ctx.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, baseRadius * 2);
      ambientGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      ambientGlow.addColorStop(0.3, 'rgba(255, 200, 150, 0.02)');
      ambientGlow.addColorStop(0.6, 'rgba(255, 180, 120, 0.01)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw the accretion disk (back part - behind black hole)
      drawAccretionDisk(ctx, baseRadius, time, true);
      
      // Photon ring - the bright thin ring caused by gravitational lensing
      drawPhotonRing(ctx, baseRadius);
      
      // Event horizon (the black center)
      const eventHorizonGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.38);
      eventHorizonGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      eventHorizonGradient.addColorStop(0.85, 'rgba(0, 0, 0, 1)');
      eventHorizonGradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.98)');
      eventHorizonGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      
      ctx.fillStyle = eventHorizonGradient;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Draw the accretion disk (front part - in front of black hole)
      drawAccretionDisk(ctx, baseRadius, time, false);
      
      // Einstein ring effect (thin bright line around event horizon)
      drawEinsteinRing(ctx, baseRadius);
      
      ctx.restore();
    };

    const drawAccretionDisk = (ctx, baseRadius, time, isBack) => {
      ctx.save();
      
      // Slight rotation for dynamism
      ctx.rotate(time * 0.02);
      
      const diskLayers = 12;
      const tilt = 0.18; // Tilt factor for 3D appearance
      
      for (let layer = 0; layer < diskLayers; layer++) {
        const layerProgress = layer / diskLayers;
        const innerRadius = baseRadius * (0.45 + layerProgress * 0.5);
        const outerRadius = baseRadius * (0.5 + layerProgress * 0.55);
        
        // Color gradient from hot white/yellow center to cooler orange/red outer
        const heat = 1 - layerProgress;
        const r = Math.floor(255);
        const g = Math.floor(180 + heat * 75);
        const b = Math.floor(100 + heat * 100);
        
        const baseAlpha = isBack ? 0.15 : 0.25;
        const alpha = baseAlpha * (1 - layerProgress * 0.6);
        
        // Draw disk as ellipse
        ctx.beginPath();
        
        if (isBack) {
          // Back part of disk (top arc)
          ctx.ellipse(0, 0, outerRadius, outerRadius * tilt, 0, Math.PI, Math.PI * 2);
          ctx.ellipse(0, 0, innerRadius, innerRadius * tilt, 0, Math.PI * 2, Math.PI, true);
        } else {
          // Front part of disk (bottom arc)
          ctx.ellipse(0, 0, outerRadius, outerRadius * tilt, 0, 0, Math.PI);
          ctx.ellipse(0, 0, innerRadius, innerRadius * tilt, 0, Math.PI, 0, true);
        }
        
        ctx.closePath();
        
        // Create gradient for each layer
        const gradient = ctx.createLinearGradient(-outerRadius, 0, outerRadius, 0);
        gradient.addColorStop(0, `rgba(${r}, ${g - 40}, ${b - 50}, ${alpha * 0.3})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g + 20}, ${b + 30}, ${alpha * 1.2})`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${r}, ${g - 40}, ${b - 50}, ${alpha * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // Add streaks/texture to disk
      for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2 + time * 0.1;
        const radiusVariation = baseRadius * (0.5 + Math.random() * 0.4);
        const tiltedY = Math.sin(angle) * radiusVariation * tilt;
        const x = Math.cos(angle) * radiusVariation;
        
        // Only draw if in correct hemisphere
        const inBack = tiltedY < 0;
        if (inBack !== isBack) continue;
        
        const streakAlpha = 0.1 + Math.random() * 0.15;
        
        ctx.beginPath();
        ctx.arc(x, tiltedY, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 180, ${streakAlpha})`;
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawPhotonRing = (ctx, baseRadius) => {
      // The iconic bright ring from gravitational lensing
      const ringRadius = baseRadius * 0.4;
      
      // Outer glow of photon ring
      for (let i = 3; i >= 0; i--) {
        const glowRadius = ringRadius + i * 3;
        const alpha = 0.1 - i * 0.02;
        
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 240, 220, ${alpha})`;
        ctx.lineWidth = 8 - i * 1.5;
        ctx.stroke();
      }
      
      // Main photon ring
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner bright edge
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius - 1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawEinsteinRing = (ctx, baseRadius) => {
      // Thin bright ring right at event horizon edge
      const ringRadius = baseRadius * 0.38;
      
      // Subtle glow
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 200, 150, 0.08)';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Sharp bright line
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 230, 200, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const animate = () => {
      // Dark blue-black gradient background (like deep space)
      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width
      );
      bgGradient.addColorStop(0, '#0a0a12');
      bgGradient.addColorStop(0.5, '#050508');
      bgGradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawStars();
      drawGargantua();
      
      time += 0.016;
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="black-hole-canvas" />;
};

export default BlackHole;
