import type { Star, ShootingStar, Galaxy, Nebula } from './types';

/**
 * Draw all stars with twinkling effect and optional space travel effect
 * 
 * Space travel simulation (warp/hyperspace effect):
 * - Stars stream outward from center (vanishing point) toward edges
 * - Each star has a unique phase offset for even distribution
 * - Phase cycles 0→1: star travels from center to edge, then resets
 * - Creates classic "warp speed" starfield effect
 */
export const drawStars = (
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  time: number,
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  driftAmount: number = 0
): void => {
  const halfWidth = canvasWidth * 0.5;
  const halfHeight = canvasHeight * 0.5;
  const centerX = halfWidth;
  const centerY = halfHeight;
  // Maximum distance from center to corner
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;
    
    // Use star properties to generate a stable random angle and phase
    const seed = (star.x * 12.9898 + star.y * 78.233) % 1000;
    const angle = (seed / 1000) * Math.PI * 2;
    
    // Initial phase based on another stable property
    const initialPhase = (star.twinkleOffset / (Math.PI * 2)) % 1;
    
    // Constant speed for all stars (no parallax)
    const speed = 0.2;
    
    // Calculate current phase based on travel
    const depthPhase = (initialPhase + driftOffset * speed) % 1;
    
    // Linear motion (Constant visual speed)
    const travelDist = maxDist * depthPhase;
    
    // Calculate new position
    const drawX = centerX + Math.cos(angle) * travelDist;
    const drawY = centerY + Math.sin(angle) * travelDist;
    
    // Skip if off-screen
    if (drawX < -10 || drawX > canvasWidth + 10 || drawY < -10 || drawY > canvasHeight + 10) {
      continue;
    }
    
    // Size: slight scaling to give depth hint without extreme perspective
    const depthSize = 0.5 + depthPhase * 1.0; 
    const drawSize = star.size * depthSize;
    
    // Alpha: Fade in gradually from center to hide the "source"
    // This creates the illusion of a tunnel with an open end
    let depthAlpha = 1;
    if (depthPhase < 0.3) {
      depthAlpha = depthPhase / 0.3;
    } 
    else if (depthPhase > 0.95) {
      depthAlpha = (1 - depthPhase) / 0.05;
    }
    
    const alpha = star.brightness * twinkle * depthAlpha;
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${alpha})`;
    ctx.fill();
  }
};

/**
 * Update and draw shooting stars - optimized version
 */
export const drawShootingStars = (
  ctx: CanvasRenderingContext2D,
  shootingStars: ShootingStar[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number
): ShootingStar[] => {
  const halfWidth = canvasWidth * 0.5;
  const halfHeight = canvasHeight * 0.5;
  const activeStars = shootingStars.filter((star) => star.life > 0);

  for (let i = 0; i < activeStars.length; i++) {
    const star = activeStars[i];
    star.x += Math.cos(star.angle) * star.speed;
    star.y += Math.sin(star.angle) * star.speed;
    star.life -= star.decay;

    const alpha = star.brightness * star.life;
    const { r, g, b } = star.color;
    
    const drawX = star.x;
    const drawY = star.y;
    
    const tailX = drawX - Math.cos(star.angle) * star.length;
    const tailY = drawY - Math.sin(star.angle) * star.length;

    // Simple line instead of gradient for performance
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(drawX, drawY);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
    ctx.lineWidth = star.size;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Bright head
    ctx.beginPath();
    ctx.arc(drawX, drawY, star.size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fill();
  }

  return activeStars;
};

/**
 * Draw all galaxies - with optional space travel effect (continuous warp)
 */
export const drawGalaxies = (
  ctx: CanvasRenderingContext2D,
  galaxies: Galaxy[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  driftAmount: number = 0
): void => {
  const halfWidth = canvasWidth * 0.5;
  const halfHeight = canvasHeight * 0.5;
  const centerX = halfWidth;
  const centerY = halfHeight;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let g = 0; g < galaxies.length; g++) {
    const galaxy = galaxies[g];
    const {
      x, y, size, rotation, brightness, type, inclination, arms,
      armTightness, armSpread, coreSize, coreColor, armColor, outerColor,
      parallaxFactor, armPoints, starPoints
    } = galaxy;
    
    // Use galaxy properties to generate a stable random angle and phase
    const seed = (x * 12.9898 + y * 78.233) % 1000;
    const angle = (seed / 1000) * Math.PI * 2;
    
    // Initial phase based on rotation (stable property)
    const initialPhase = (rotation / (Math.PI * 2)) % 1;
    
    // Constant speed
    const speed = 0.1;
    
    // Calculate current phase
    const depthPhase = (initialPhase + driftOffset * speed) % 1;
    
    // Linear motion (Constant visual speed)
    const travelDist = maxDist * depthPhase;
    
    // Calculate new position
    const drawX = centerX + Math.cos(angle) * travelDist;
    const drawY = centerY + Math.sin(angle) * travelDist;
    
    // Skip if off-screen
    if (drawX < -size || drawX > canvasWidth + size || drawY < -size || drawY > canvasHeight + size) {
      continue;
    }
    
    // Size: slight scaling
    const depthSize = 0.5 + depthPhase * 1.0;
    const sizeMultiplier = depthSize;
    
    // Alpha: fade in/out
    let depthAlpha = 1;
    if (depthPhase < 0.3) {
      depthAlpha = depthPhase / 0.3;
    } else if (depthPhase > 0.95) {
      depthAlpha = (1 - depthPhase) / 0.05;
    }
    const effectiveBrightness = brightness * depthAlpha;
    
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(rotation);
    ctx.scale(sizeMultiplier, sizeMultiplier * (1 - inclination * 0.85));
    
    const coreRadius = size * coreSize;
    
    // Single core glow gradient (one per galaxy is acceptable)
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 1.5);
    coreGlow.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${effectiveBrightness * 0.4})`);
    coreGlow.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    if (type === 'elliptical' || type === 'lenticular') {
      // Draw as simple solid circles - no gradients per star
      for (let i = 0; i < starPoints.length; i++) {
        const star = starPoints[i];
        const sx = star.x * size;
        const sy = star.y * size;
        const distFromCenter = Math.sqrt(star.x * star.x + star.y * star.y);
        const alpha = effectiveBrightness * star.brightness * Math.max(0, 1 - distFromCenter * 0.8);
        
        if (alpha > 0.02) {
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${alpha})`;
          ctx.fill();
        }
      }
      
    } else if (type === 'irregular') {
      for (let i = 0; i < starPoints.length; i++) {
        const star = starPoints[i];
        const sx = star.x * size;
        const sy = star.y * size;
        const alpha = effectiveBrightness * star.brightness;
        
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${alpha})`;
        ctx.fill();
      }
      
    } else if (type === 'barred-spiral') {
      const barLength = size * 0.35;
      
      // Draw spiral arms from bar ends - simple dots
      for (let armIndex = 0; armIndex < 2; armIndex++) {
        const armRotation = armIndex === 0 ? 0 : Math.PI;
        const points = armPoints[armIndex] || [];
        
        for (let i = 0; i < points.length; i++) {
          const { t, offset, dotSize } = points[i];
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
          
          const alpha = effectiveBrightness * (1 - t * 0.6) * 0.6;
          
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        }
      }
      
    } else {
      // Regular spiral galaxy
      for (let armIndex = 0; armIndex < arms; armIndex++) {
        const armRotation = (armIndex / arms) * Math.PI * 2;
        const points = armPoints[armIndex] || [];
        
        for (let i = 0; i < points.length; i++) {
          const { t, offset, dotSize } = points[i];
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
          
          const alpha = effectiveBrightness * (1 - t * 0.6) * 0.6;
          
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  }
};

/**
 * Draw all nebulas - with optional space travel effect (continuous warp)
 */
export const drawNebulas = (
  ctx: CanvasRenderingContext2D,
  nebulas: Nebula[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  driftAmount: number = 0
): void => {
  const halfWidth = canvasWidth * 0.5;
  const halfHeight = canvasHeight * 0.5;
  const centerX = halfWidth;
  const centerY = halfHeight;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let n = 0; n < nebulas.length; n++) {
    const nebula = nebulas[n];
    const {
      x, y, size, brightness, color1, color2, color3, rotation,
      layers, blobs, filaments, dustParticles, parallaxFactor
    } = nebula;
    
    // Calculate initial position properties relative to center
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Determine initial phase from static position
    // Inverse of travelDist function: p = r/R (linear)
    const initialPhase = dist / maxDist;
    
    // Constant speed
    const speed = 0.05;
    
    // Calculate current phase
    const depthPhase = (initialPhase + driftOffset * speed) % 1;
    
    // Linear motion (Constant visual speed)
    const travelDist = maxDist * depthPhase;
    
    // Calculate new position
    const drawX = centerX + Math.cos(angle) * travelDist;
    const drawY = centerY + Math.sin(angle) * travelDist;
    
    // Skip if off-screen
    if (drawX < -size || drawX > canvasWidth + size || drawY < -size || drawY > canvasHeight + size) {
      continue;
    }
    
    // Size: slight scaling
    const depthSize = 0.5 + depthPhase * 1.0;
    const sizeMultiplier = depthSize;
    
    // Alpha: fade in/out
    let depthAlpha = 1;
    if (depthPhase < 0.3) {
      depthAlpha = depthPhase / 0.3;
    } else if (depthPhase > 0.95) {
      depthAlpha = (1 - depthPhase) / 0.05;
    }
    const effectiveBrightness = brightness * depthAlpha;
    
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(rotation);
    ctx.scale(sizeMultiplier, sizeMultiplier);
    
    // Draw layers using simple filled circles with opacity
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const { offsetX, offsetY, opacity } = layer;
      const colorIndex = li % 3;
      const color = colorIndex === 0 ? color1 : colorIndex === 1 ? color2 : color3;
      
      const layerBlobs = blobs[li] || [];
      for (let bi = 0; bi < layerBlobs.length; bi++) {
        const blob = layerBlobs[bi];
        const blobX = offsetX + Math.cos(blob.angle) * blob.dist;
        const blobY = offsetY + Math.sin(blob.angle) * blob.dist * 0.7;
        
        const alpha = effectiveBrightness * opacity * 0.15;
        ctx.beginPath();
        ctx.arc(blobX, blobY, blob.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
      }
    }
    
    // Draw filaments as simple strokes
    for (let fi = 0; fi < filaments.length; fi++) {
      const filament = filaments[fi];
      const startX = Math.cos(filament.startAngle) * filament.startDist;
      const startY = Math.sin(filament.startAngle) * filament.startDist * 0.7;
      const endX = Math.cos(filament.endAngle) * filament.endDist;
      const endY = Math.sin(filament.endAngle) * filament.endDist * 0.7;
      
      const filamentColor = filament.colorIndex === 0 ? color2 : color3;
      const strokeAlpha = effectiveBrightness * 0.12;
      
      ctx.strokeStyle = `rgba(${filamentColor.r}, ${filamentColor.g}, ${filamentColor.b}, ${strokeAlpha})`;
      ctx.lineWidth = filament.lineWidth;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(filament.ctrlX, filament.ctrlY, endX, endY);
      ctx.stroke();
    }
    
    // Draw dust particles - simple circles
    for (let di = 0; di < dustParticles.length; di++) {
      const particle = dustParticles[di];
      const px = Math.cos(particle.angle) * particle.dist;
      const py = Math.sin(particle.angle) * particle.dist * 0.7;
      
      const dustColor = particle.colorIndex === 0 ? color2 : color3;
      const distRatio = particle.dist / size;
      const dustAlpha = effectiveBrightness * particle.alpha * 0.3 * Math.max(0, 1 - distRatio * 0.8);
      
      if (dustAlpha > 0.01) {
        ctx.beginPath();
        ctx.arc(px, py, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dustColor.r}, ${dustColor.g}, ${dustColor.b}, ${dustAlpha})`;
        ctx.fill();
      }
    }
    
    // Draw embedded stars - simple bright dots
    const embeddedStars = nebula.embeddedStars;
    for (let si = 0; si < embeddedStars.length; si++) {
      const star = embeddedStars[si];
      const sx = Math.cos(star.angle) * star.dist;
      const sy = Math.sin(star.angle) * star.dist * 0.7;
      const { r, g, b } = star.color;
      
      // Outer glow - just one layer
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.brightness * 0.3})`;
      ctx.fill();
      
      // Bright core
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.9})`;
      ctx.fill();
    }
    
    // Single subtle core gradient (one per nebula is acceptable)
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.15);
    coreGradient.addColorStop(0, `rgba(${color3.r}, ${color3.g}, ${color3.b}, ${effectiveBrightness * 0.25})`);
    coreGradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
};

/**
 * Draw star clusters
 */
export const drawStarClusters = (
  ctx: CanvasRenderingContext2D,
  clusters: import('./types').StarCluster[],
  mouseX: number,
  mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  driftAmount: number = 0,
  time: number
): void => {
  const halfWidth = canvasWidth * 0.5;
  const halfHeight = canvasHeight * 0.5;
  const centerX = halfWidth;
  const centerY = halfHeight;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let c = 0; c < clusters.length; c++) {
    const cluster = clusters[c];
    const { x, y, size, brightness, stars, color, parallaxFactor, rotation } = cluster;
    
    // Calculate initial position properties relative to center
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Determine initial phase from static position
    const initialPhase = dist / maxDist;
    
    // Constant speed
    const speed = 0.15; // Slightly faster than galaxies
    
    // Calculate current phase
    const depthPhase = (initialPhase + driftOffset * speed) % 1;
    
    // Linear motion
    const travelDist = maxDist * depthPhase;
    
    // Calculate new position
    const drawX = centerX + Math.cos(angle) * travelDist;
    const drawY = centerY + Math.sin(angle) * travelDist;
    
    // Skip if off-screen
    if (drawX < -size || drawX > canvasWidth + size || drawY < -size || drawY > canvasHeight + size) {
      continue;
    }
    
    // Size: slight scaling
    const depthSize = 0.5 + depthPhase * 1.0;
    const sizeMultiplier = depthSize;
    
    // Alpha: fade in/out
    let depthAlpha = 1;
    if (depthPhase < 0.3) {
      depthAlpha = depthPhase / 0.3;
    } else if (depthPhase > 0.95) {
      depthAlpha = (1 - depthPhase) / 0.05;
    }
    const effectiveBrightness = brightness * depthAlpha;
    
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(rotation);
    ctx.scale(sizeMultiplier, sizeMultiplier);
    
    // Draw cluster glow
    const glowRadius = size * 1.2;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    glow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${effectiveBrightness * 0.15})`);
    glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw stars
    for (let s = 0; s < stars.length; s++) {
      const star = stars[s];
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
      const alpha = effectiveBrightness * star.brightness * twinkle;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${alpha})`;
      ctx.fill();
    }
    
    ctx.restore();
  }
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
