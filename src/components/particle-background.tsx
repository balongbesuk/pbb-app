"use client";

import React, { useEffect, useRef } from "react";

const BASE_PARTICLE_COUNT = 250;

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
}

export const ParticleBackground = ({ isDark }: { isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    
    // Smooth mouse interpolation
    const ease = 0.05;

    const initParticles = () => {
      particles = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Scale particle count by screen area so mobile phones aren't crushed
      const area = (w * h) / (1920 * 1080);
      const count = Math.max(50, Math.min(BASE_PARTICLE_COUNT, Math.floor(BASE_PARTICLE_COUNT * Math.sqrt(area))));
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 2 + 0.35, // balanced depth 
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.2, // slight upward drift
          size: Math.random() * 1.7 + 0.5,
        });
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Interpolate mouse
      mouse.x += (mouse.targetX - mouse.x) * ease;
      mouse.y += (mouse.targetY - mouse.y) * ease;

      // Draw background gradient directly on canvas for maximum quality
      const gradient = ctx.createRadialGradient(w/2, 0, 0, w/2, 0, h);
      if (isDark) {
         gradient.addColorStop(0, "#0F203B");
         gradient.addColorStop(0.6, "#050B14");
         gradient.addColorStop(1, "#02060D");
      } else {
         gradient.addColorStop(0, "#f0f4ff");
         gradient.addColorStop(1, "#e8f0fe");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Base colors based on theme
      const baseColor = isDark ? "rgba(96, 165, 250, " : "rgba(37, 99, 235, "; // Blue-400 dark, Blue-600 light
      const accentColor = isDark ? "rgba(56, 189, 248, " : "rgba(30, 64, 175, "; // Sky-400 dark, Blue-800 light

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx / p.z;
        p.y += p.vy / p.z;

        // Mouse interaction (repel/attract based on distance)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const interactionRadiusSq = 25000; // 150px radius squared
        
        if (distSq < interactionRadiusSq && distSq > 0) {
           const force = (interactionRadiusSq - distSq) / interactionRadiusSq;
           p.x -= (dx / Math.sqrt(distSq)) * force * 2;
           p.y -= (dy / Math.sqrt(distSq)) * force * 2;
        }

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw
        const opacity = Math.min(1, Math.max(0.1, 1 - (p.z / 2.5)));
        const color = i % 3 === 0 ? accentColor : baseColor;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / p.z, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${opacity})`;
        ctx.fill();
        
        // Very lightweight "glow" fake effect for dark mode - draw a huge faded circle
        if (isDark) {
           ctx.beginPath();
           ctx.arc(p.x, p.y, (p.size / p.z) * 3, 0, Math.PI * 2);
           ctx.fillStyle = `${color}${opacity * 0.15})`;
           ctx.fill();
        }
        
        // Draw connections (constellation effect) for nearby particles
        for(let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx2 = p.x - p2.x;
            const dy2 = p.y - p2.y;
            const dist2Sq = dx2 * dx2 + dy2 * dy2;
            
            if (dist2Sq < 19600) { // connect within ~140px
                const connOpacity = (1 - dist2Sq / 19600) * 0.45 * opacity;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `${color}${connOpacity})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    handleResize();
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0, // Solid background so put it at the very bottom
        pointerEvents: "none",
      }}
    />
  );
};
