import type { Star, ShootingStar, Galaxy, Nebula } from './types';

/**
 * Draw all stars with twinkling effect
 */
export const drawStars = (
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  time: number,
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number
): void => {
  stars.forEach((star) => {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
    const alpha = star.brightness * twinkle;
    const { r, g, b } = star.color;
    
    const parallaxX = mouseX * star.parallaxFactor * canvasWidth * 0.5;
    const parallaxY = mouseY * star.parallaxFactor * canvasHeight * 0.5;
    const drawX = star.x + parallaxX;
    const drawY = star.y + parallaxY;
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fill();
    
    if (star.brightness > 0.6) {
      ctx.beginPath();
      ctx.arc(drawX, drawY, star.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
      ctx.fill();
    }
  });
};

/**
 * Update and draw shooting stars
 */
export const drawShootingStars = (
  ctx: CanvasRenderingContext2D,
  shootingStars: ShootingStar[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number
): ShootingStar[] => {
  const activeStars = shootingStars.filter((star) => star.life > 0);

  activeStars.forEach((star) => {
    star.x += Math.cos(star.angle) * star.speed;
    star.y += Math.sin(star.angle) * star.speed;
    star.life -= star.decay;

    const alpha = star.brightness * star.life;
    const { r, g, b } = star.color;
    
    const parallaxX = mouseX * star.parallaxFactor * canvasWidth * 0.5;
    const parallaxY = mouseY * star.parallaxFactor * canvasHeight * 0.5;
    const drawX = star.x + parallaxX;
    const drawY = star.y + parallaxY;
    
    const tailX = drawX - Math.cos(star.angle) * star.length;
    const tailY = drawY - Math.sin(star.angle) * star.length;

    const gradient = ctx.createLinearGradient(tailX, tailY, drawX, drawY);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
    gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(drawX, drawY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = star.size;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fill();

    const glowGradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, star.size * 5);
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
    glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, star.size * 5, 0, Math.PI * 2);
    ctx.fill();
  });

  return activeStars;
};

/**
 * Draw all galaxies - using scattered stars/particles for realistic appearance
 */
export const drawGalaxies = (
  ctx: CanvasRenderingContext2D,
  galaxies: Galaxy[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number
): void => {
  galaxies.forEach((galaxy) => {
    const {
      x, y, size, rotation, brightness, type, inclination, arms,
      armTightness, armSpread, coreSize, coreColor, armColor, outerColor,
      parallaxFactor, armPoints, starPoints
    } = galaxy;
    
    const parallaxX = mouseX * parallaxFactor * canvasWidth * 0.5;
    const parallaxY = mouseY * parallaxFactor * canvasHeight * 0.5;
    
    ctx.save();
    ctx.translate(x + parallaxX, y + parallaxY);
    ctx.rotate(rotation);
    
    // Apply 3D inclination
    const yScale = 1 - inclination * 0.85;
    ctx.scale(1, yScale);
    
    // For all galaxy types, draw a soft central core glow first
    const coreRadius = size * coreSize;
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 1.5);
    coreGlow.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 0.4})`);
    coreGlow.addColorStop(0.4, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${brightness * 0.2})`);
    coreGlow.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    if (type === 'elliptical' || type === 'lenticular') {
      // Draw elliptical galaxies using scattered star points only - no solid shapes
      starPoints.forEach((star) => {
        const sx = star.x * size;
        const sy = star.y * size;
        const distFromCenter = Math.sqrt(star.x * star.x + star.y * star.y);
        const alpha = brightness * star.brightness * Math.max(0, 1 - distFromCenter * 0.8);
        
        if (alpha > 0.005) {
          // Draw star with soft glow
          const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 3);
          starGlow.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${alpha})`);
          starGlow.addColorStop(0.5, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${alpha * 0.3})`);
          starGlow.addColorStop(1, `rgba(${outerColor.r}, ${outerColor.g}, ${outerColor.b}, 0)`);
          ctx.fillStyle = starGlow;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
    } else if (type === 'irregular') {
      // Irregular galaxies - scattered clumpy star regions
      starPoints.forEach((star) => {
        const sx = star.x * size;
        const sy = star.y * size;
        const alpha = brightness * star.brightness * 1.2;
        
        // Clumpy irregular structure
        const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 2.5);
        starGlow.addColorStop(0, `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${alpha})`);
        starGlow.addColorStop(0.6, `rgba(${outerColor.r}, ${outerColor.g}, ${outerColor.b}, ${alpha * 0.2})`);
        starGlow.addColorStop(1, `rgba(${outerColor.r}, ${outerColor.g}, ${outerColor.b}, 0)`);
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      
    } else if (type === 'barred-spiral') {
      // Draw bar as scattered elongated glow
      const barLength = size * 0.35;
      const barWidth = size * 0.1;
      
      // Draw bar particles
      for (let i = 0; i < 15; i++) {
        const bx = (Math.random() - 0.5) * barLength * 2;
        const by = (Math.random() - 0.5) * barWidth * 2;
        const barAlpha = brightness * 0.3 * (1 - Math.abs(bx) / barLength);
        const particleSize = 2 + Math.random() * 4;
        
        const barGlow = ctx.createRadialGradient(bx, by, 0, bx, by, particleSize);
        barGlow.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${barAlpha})`);
        barGlow.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
        ctx.fillStyle = barGlow;
        ctx.beginPath();
        ctx.arc(bx, by, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw spiral arms from bar ends
      for (let armIndex = 0; armIndex < 2; armIndex++) {
        const armRotation = armIndex === 0 ? 0 : Math.PI;
        const points = armPoints[armIndex] || [];
        
        points.forEach((point) => {
          const { t, offset, dotSize } = point;
          const spiralAngle = armRotation + t * Math.PI * armTightness;
          const distance = barLength * 0.8 + t * (size - barLength);
          
          const baseX = Math.cos(spiralAngle) * distance;
          const baseY = Math.sin(spiralAngle) * distance * armSpread;
          
          const perpAngle = spiralAngle + Math.PI / 2;
          const armX = baseX + Math.cos(perpAngle) * offset;
          const armY = baseY + Math.sin(perpAngle) * offset * armSpread;
          
          const colorBlend = t;
          const r = Math.floor(armColor.r * (1 - colorBlend) + outerColor.r * colorBlend);
          const g = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
          const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
          
          const alpha = brightness * (1 - t * 0.6) * 0.8;
          
          // Draw as soft glowing particle
          const particleGlow = ctx.createRadialGradient(armX, armY, 0, armX, armY, dotSize * 2);
          particleGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          particleGlow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
          particleGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = particleGlow;
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize * 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
    } else {
      // Regular spiral galaxy - draw arms as scattered particles
      for (let armIndex = 0; armIndex < arms; armIndex++) {
        const armRotation = (armIndex / arms) * Math.PI * 2;
        const points = armPoints[armIndex] || [];
        
        points.forEach((point) => {
          const { t, offset, dotSize } = point;
          const spiralAngle = armRotation + t * Math.PI * armTightness;
          const distance = coreRadius * 0.5 + t * (size - coreRadius * 0.5);
          
          const baseX = Math.cos(spiralAngle) * distance;
          const baseY = Math.sin(spiralAngle) * distance * armSpread;
          
          const perpAngle = spiralAngle + Math.PI / 2;
          const armX = baseX + Math.cos(perpAngle) * offset;
          const armY = baseY + Math.sin(perpAngle) * offset * armSpread;
          
          const colorBlend = t;
          const r = Math.floor(armColor.r * (1 - colorBlend) + outerColor.r * colorBlend);
          const g = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
          const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
          
          const alpha = brightness * (1 - t * 0.6) * 0.8;
          
          // Draw as soft glowing particle
          const particleGlow = ctx.createRadialGradient(armX, armY, 0, armX, armY, dotSize * 2);
          particleGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
          particleGlow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
          particleGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = particleGlow;
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize * 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    
    ctx.restore();
  });
};

/**
 * Draw all nebulas - using scattered particles for organic wispy appearance
 */
export const drawNebulas = (
  ctx: CanvasRenderingContext2D,
  nebulas: Nebula[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number
): void => {
  nebulas.forEach((nebula) => {
    const {
      x, y, size, brightness, color1, color2, color3, rotation,
      layers, blobs, filaments, dustParticles, parallaxFactor
    } = nebula;
    
    const parallaxX = mouseX * parallaxFactor * canvasWidth * 0.5;
    const parallaxY = mouseY * parallaxFactor * canvasHeight * 0.5;
    
    ctx.save();
    ctx.translate(x + parallaxX, y + parallaxY);
    ctx.rotate(rotation);
    
    // Draw wispy cloud layers using many small overlapping gradients
    layers.forEach((layer, layerIndex) => {
      const { offsetX, offsetY, opacity } = layer;
      const colorIndex = layerIndex % 3;
      const color = colorIndex === 0 ? color1 : colorIndex === 1 ? color2 : color3;
      
      const layerBlobs = blobs[layerIndex] || [];
      layerBlobs.forEach((blob) => {
        const blobX = offsetX + Math.cos(blob.angle) * blob.dist;
        const blobY = offsetY + Math.sin(blob.angle) * blob.dist * 0.7;
        
        // Create soft, wispy gradient with very gradual falloff
        const gradient = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, blob.size);
        const alpha = brightness * opacity * 0.6;  // Reduced opacity for subtlety
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.25})`);
        gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.1})`);
        gradient.addColorStop(0.85, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.03})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blobX, blobY, blob.size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    // Draw wispy filaments as soft strokes
    filaments.forEach((filament) => {
      const startX = Math.cos(filament.startAngle) * filament.startDist;
      const startY = Math.sin(filament.startAngle) * filament.startDist * 0.7;
      const endX = Math.cos(filament.endAngle) * filament.endDist;
      const endY = Math.sin(filament.endAngle) * filament.endDist * 0.7;
      
      const filamentColor = filament.colorIndex === 0 ? color2 : color3;
      
      // Draw multiple thin strokes for wispy effect
      for (let w = 0; w < 3; w++) {
        const widthOffset = (w - 1) * filament.lineWidth * 0.3;
        const strokeAlpha = brightness * 0.15 * (1 - Math.abs(w - 1) * 0.3);
        
        ctx.strokeStyle = `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, ${strokeAlpha})`;
        ctx.lineWidth = filament.lineWidth * (1 - Math.abs(w - 1) * 0.3);
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX + widthOffset * 0.5, startY + widthOffset * 0.5);
        ctx.quadraticCurveTo(
          filament.ctrlX + widthOffset,
          filament.ctrlY + widthOffset,
          endX + widthOffset * 0.5,
          endY + widthOffset * 0.5
        );
        ctx.stroke();
      }
    });
    
    // Draw scattered dust particles for texture
    dustParticles.forEach((particle) => {
      const px = Math.cos(particle.angle) * particle.dist;
      const py = Math.sin(particle.angle) * particle.dist * 0.7;
      
      const dustColor = particle.colorIndex === 0 ? color2 : color3;
      const distRatio = particle.dist / size;
      const dustAlpha = brightness * particle.alpha * 0.5 * Math.max(0, 1 - distRatio * 0.8);
      
      if (dustAlpha > 0.002) {
        // Soft glowing dust particle
        const dustGlow = ctx.createRadialGradient(px, py, 0, px, py, particle.size * 2);
        dustGlow.addColorStop(0, `rgba(${dustColor.r}, ${dustColor.g}, ${dustColor.b}, ${dustAlpha})`);
        dustGlow.addColorStop(0.5, `rgba(${dustColor.r}, ${dustColor.g}, ${dustColor.b}, ${dustAlpha * 0.3})`);
        dustGlow.addColorStop(1, `rgba(${dustColor.r}, ${dustColor.g}, ${dustColor.b}, 0)`);
        ctx.fillStyle = dustGlow;
        ctx.beginPath();
        ctx.arc(px, py, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw embedded stars with glow
    nebula.embeddedStars.forEach((star) => {
      const sx = Math.cos(star.angle) * star.dist;
      const sy = Math.sin(star.angle) * star.dist * 0.7;
      const { r, g, b } = star.color;
      
      // Star glow
      const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 4);
      starGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${star.brightness})`);
      starGlow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${star.brightness * 0.4})`);
      starGlow.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${star.brightness * 0.1})`);
      starGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright core
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.9})`;
      ctx.fill();
    });
    
    // Very subtle central glow
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.2);
    coreGradient.addColorStop(0, `rgba(${color3.r}, ${color3.g}, ${color3.b}, ${brightness * 0.4})`);
    coreGradient.addColorStop(0.5, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${brightness * 0.15})`);
    coreGradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
};

/**
 * Draw the background gradient
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const bgGradient = ctx.createRadialGradient(
    width * 0.5, height * 0.5, 0,
    width * 0.5, height * 0.5, width * 0.8
  );
  bgGradient.addColorStop(0, '#0a0a10');
  bgGradient.addColorStop(0.5, '#050508');
  bgGradient.addColorStop(1, '#000000');
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
};
