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
      const numStars = Math.floor((canvas.width * canvas.height) / 3000);
      
      for (let i = 0; i < numStars; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * Math.max(canvas.width, canvas.height) * 0.8 + 100;
        
        stars.push({
          x: canvas.width / 2 + Math.cos(angle) * distance,
          y: canvas.height / 2 + Math.sin(angle) * distance,
          originalX: canvas.width / 2 + Math.cos(angle) * distance,
          originalY: canvas.height / 2 + Math.sin(angle) * distance,
          size: Math.random() * 1.5 + 0.5,
          brightness: Math.random(),
          speed: Math.random() * 0.0005 + 0.0002,
          angle: angle,
          distance: distance,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawBlackHole = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;

      // Outer glow - gravitational lensing effect
      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, maxRadius * 0.3,
        centerX, centerY, maxRadius * 1.5
      );
      outerGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      outerGlow.addColorStop(0.3, 'rgba(20, 20, 25, 0.3)');
      outerGlow.addColorStop(0.5, 'rgba(40, 40, 50, 0.2)');
      outerGlow.addColorStop(0.7, 'rgba(60, 60, 70, 0.1)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Accretion disk
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.1);
      
      for (let i = 0; i < 3; i++) {
        const diskGradient = ctx.createRadialGradient(
          0, 0, maxRadius * 0.25,
          0, 0, maxRadius * 0.8
        );
        
        const alpha = 0.03 - i * 0.008;
        diskGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        diskGradient.addColorStop(0.3, `rgba(200, 200, 210, ${alpha})`);
        diskGradient.addColorStop(0.5, `rgba(150, 150, 160, ${alpha * 0.8})`);
        diskGradient.addColorStop(0.7, `rgba(100, 100, 110, ${alpha * 0.5})`);
        diskGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = diskGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, maxRadius * 0.8, maxRadius * 0.15, i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();

      // Photon sphere - bright ring around event horizon
      const photonRing = ctx.createRadialGradient(
        centerX, centerY, maxRadius * 0.18,
        centerX, centerY, maxRadius * 0.28
      );
      photonRing.addColorStop(0, 'rgba(0, 0, 0, 0)');
      photonRing.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
      photonRing.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      photonRing.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      photonRing.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = photonRing;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon - the black center
      const eventHorizon = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius * 0.2
      );
      eventHorizon.addColorStop(0, 'rgba(0, 0, 0, 1)');
      eventHorizon.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
      eventHorizon.addColorStop(0.85, 'rgba(0, 0, 0, 0.98)');
      eventHorizon.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      
      ctx.fillStyle = eventHorizon;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawStars = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const eventHorizonRadius = Math.min(canvas.width, canvas.height) * 0.35 * 0.2;

      stars.forEach((star, index) => {
        // Calculate distance from center
        const dx = star.x - centerX;
        const dy = star.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Gravitational pull effect - stars closer to center move faster
        const pullStrength = Math.max(0, 1 - distance / (canvas.width * 0.5));
        const angle = Math.atan2(dy, dx);
        
        // Orbital motion
        star.angle += star.speed * (1 + pullStrength * 2);
        
        // Stars spiral inward very slowly
        if (distance > eventHorizonRadius * 1.5) {
          star.distance -= pullStrength * 0.05;
        }
        
        // Recalculate position
        star.x = centerX + Math.cos(star.angle) * star.distance;
        star.y = centerY + Math.sin(star.angle) * star.distance;
        
        // Reset stars that get too close to event horizon
        if (star.distance < eventHorizonRadius * 1.2) {
          star.distance = Math.max(canvas.width, canvas.height) * 0.8;
          star.angle = Math.random() * Math.PI * 2;
        }
        
        // Twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;
        
        // Gravitational lensing - stars near black hole appear distorted/brighter
        const lensingFactor = distance < eventHorizonRadius * 3 
          ? 1 + (1 - distance / (eventHorizonRadius * 3)) * 0.5 
          : 1;
        
        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * lensingFactor, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * lensingFactor})`;
        ctx.fill();
        
        // Add subtle glow to brighter stars
        if (star.brightness > 0.7) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3 * lensingFactor, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
          ctx.fill();
        }
      });
    };

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawStars();
      drawBlackHole();
      
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
