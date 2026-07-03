/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GALLERY_PHOTOS } from '../data';

export default function GallerySection() {
  return (
    <section id="gallery-section" className="py-24 bg-brand-surface border-t border-brand-divider">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-brand-text-muted">THE GALLERY OF DEVOTION</span>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-text-primary tracking-wide">
            Moments Captured In Light
          </h2>
          <div className="w-12 h-[1px] bg-brand-gold mx-auto mt-4" />
        </div>

        {/* Masonry Styled Column Grid */}
        <div id="gallery-masonry-container" className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {GALLERY_PHOTOS.map((photo, i) => (
            <div
              key={i}
              className={`gallery-item relative overflow-hidden group border border-brand-divider break-inside-avoid bg-brand-bg-secondary cursor-pointer ${photo.heightClass}`}
            >
              {/* Image element */}
              <img
                src={photo.url}
                alt={photo.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />

              {/* Minimalist translucent overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-text-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6" />

              {/* Text label floating at bottom */}
              <div className="absolute bottom-6 left-6 right-6 text-left transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
                <span className="font-sans text-[8px] tracking-[0.3em] text-brand-gold uppercase block mb-1">CULTURALLY INSPIRED</span>
                <h4 className="font-serif text-base font-medium text-brand-surface tracking-wide">{photo.caption}</h4>
              </div>

              {/* Thin double border effect */}
              <div className="absolute inset-4 border border-brand-gold/0 group-hover:border-brand-gold/30 transition-all duration-700 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
