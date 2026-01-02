import type { Galaxy, Nebula } from './types';

/**
 * Draw all galaxies with space travel effect (continuous warp)
 */
export const drawGalaxies = (
  ctx: CanvasRenderingContext2D,
  galaxies: Galaxy[],
  _mouseX: number,
  _mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  _driftAmount: number = 0
): void => {
  const centerX = canvasWidth * 0.5;
  const centerY = canvasHeight * 0.5;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let g = 0; g < galaxies.length; g++) {
    const galaxy = galaxies[g];
    const {
      x, y, size, rotation, brightness, type, inclination, arms,
      armTightness, armSpread, coreSize, coreColor, armColor, outerColor,
      armPoints, starPoints
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
    
    // Size: slight scaling - start smaller for smoother entry
    const depthSize = 0.1 + depthPhase * 1.4;
    const sizeMultiplier = depthSize;
    
    // Alpha: fade in/out
    let depthAlpha = 1;
    if (depthPhase < 0.4) {
      const t = depthPhase / 0.4;
      depthAlpha = t * t; // Quadratic ease-in
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
        const starAlpha = effectiveBrightness * star.brightness * Math.max(0, 1 - distFromCenter * 0.8);
        
        if (starAlpha > 0.02) {
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${starAlpha})`;
          ctx.fill();
        }
      }
      
    } else if (type === 'irregular') {
      for (let i = 0; i < starPoints.length; i++) {
        const star = starPoints[i];
        const sx = star.x * size;
        const sy = star.y * size;
        const starAlpha = effectiveBrightness * star.brightness;
        
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${armColor.r}, ${armColor.g}, ${armColor.b}, ${starAlpha})`;
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
          const gCol = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
          const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
          
          const pointAlpha = effectiveBrightness * (1 - t * 0.6) * 0.6;
          
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${gCol}, ${b}, ${pointAlpha})`;
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
          const gCol = Math.floor(armColor.g * (1 - colorBlend) + outerColor.g * colorBlend);
          const b = Math.floor(armColor.b * (1 - colorBlend) + outerColor.b * colorBlend);
          
          const pointAlpha = effectiveBrightness * (1 - t * 0.6) * 0.6;
          
          ctx.beginPath();
          ctx.arc(armX, armY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${gCol}, ${b}, ${pointAlpha})`;
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  }
};

/**
 * Draw all nebulas with space travel effect (continuous warp)
 */
export const drawNebulas = (
  ctx: CanvasRenderingContext2D,
  nebulas: Nebula[],
  _mouseX: number,
  _mouseY: number,
  canvasWidth: number,
  canvasHeight: number,
  driftOffset: number = 0,
  _driftAmount: number = 0
): void => {
  const centerX = canvasWidth * 0.5;
  const centerY = canvasHeight * 0.5;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  for (let n = 0; n < nebulas.length; n++) {
    const nebula = nebulas[n];
    const {
      x, y, size, brightness, color1, color2, color3, rotation,
      layers, blobs, filaments, dustParticles
    } = nebula;
    
    // Calculate initial position properties relative to center
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Determine initial phase from static position
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
    
    // Size: slight scaling - start smaller for smoother entry
    const depthSize = 0.1 + depthPhase * 1.4;
    const sizeMultiplier = depthSize;
    
    // Alpha: fade in/out
    let depthAlpha = 1;
    if (depthPhase < 0.4) {
      const t = depthPhase / 0.4;
      depthAlpha = t * t; // Quadratic ease-in
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
        
        const blobAlpha = effectiveBrightness * opacity * 0.15;
        ctx.beginPath();
        ctx.arc(blobX, blobY, blob.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${blobAlpha})`;
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
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.brightness * 0.9})`;
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
