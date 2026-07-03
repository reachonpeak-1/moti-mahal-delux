/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading');

  // Smooth progress increment
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1.6;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setPhase('reveal');
          // Signal complete to parent after the CSS slide-up transition finishes
          setTimeout(() => {
            setPhase('done');
            onComplete();
          }, 1100); // match the transition duration (1000ms + buffer)
        }, 300);
      }
      setProgress(current);
    }, 15);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (phase === 'done') return null;

  const isRevealing = phase === 'reveal';

  return (
    <div
      id="loading-container"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg-primary text-brand-text-primary select-none pointer-events-none"
      style={{
        transform: isRevealing ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 1000ms cubic-bezier(0.85, 0, 0.15, 1)',
        willChange: 'transform',
      }}
    >
      <div className="relative flex flex-col items-center justify-center p-8 max-w-md text-center">
        
        {/* Parallax Logo Image */}
        <img
          id="loading-logo-image"
          src={logo}
          alt="Moti Mahal Delux"
          className="h-24 md:h-32 w-auto object-contain"
          style={{
            opacity: progress > 5 ? (isRevealing ? 0 : 1) : 0,
            transform: isRevealing 
              ? 'translateY(-60px) scale(0.92)' 
              : `scale(${progress > 5 ? 1 : 0.96})`,
            transition: isRevealing 
              ? 'all 900ms cubic-bezier(0.85, 0, 0.15, 1)' 
              : 'opacity 600ms ease, transform 600ms ease',
          }}
        />

        {/* Minimal Progress Bar */}
        <div
          id="loading-progress-container"
          className="w-56 h-[2.5px] bg-brand-divider mt-10 overflow-hidden relative"
          style={{
            opacity: isRevealing ? 0 : 1,
            transform: isRevealing ? 'translateY(-30px)' : 'none',
            transition: 'all 800ms cubic-bezier(0.85, 0, 0.15, 1)',
          }}
        >
          <div
            className="h-full bg-brand-gold absolute left-0 top-0 transition-all duration-75"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Loading percentage */}
        <span
          id="loading-percentage"
          className="mt-3 font-mono text-xs md:text-sm tracking-widest text-brand-gold font-medium"
          style={{
            opacity: progress > 10 ? (isRevealing ? 0 : 1) : 0,
            transform: isRevealing ? 'translateY(-20px)' : 'none',
            transition: 'all 800ms cubic-bezier(0.85, 0, 0.15, 1)',
          }}
        >
          {Math.min(100, Math.floor(progress))}%
        </span>

        {/* Vintage Heritage Tag */}
        <div
          id="loading-heritage"
          className="absolute bottom-[-50px] font-serif italic text-sm text-brand-text-primary tracking-wider"
          style={{
            opacity: progress > 25 ? (isRevealing ? 0 : 0.8) : 0,
            transform: isRevealing ? 'translateY(30px)' : 'none',
            transition: 'all 900ms cubic-bezier(0.85, 0, 0.15, 1)',
          }}
        >
          Est. 1920 • New Delhi
        </div>
      </div>
    </div>
  );
}
