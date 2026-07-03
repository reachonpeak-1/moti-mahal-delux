/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import StorySection from '../components/StorySection';
import GallerySection from '../components/GallerySection';
import ReviewsSection from '../components/ReviewsSection';

export default function StoryView() {
  return (
    <div id="story-view-stage" className="bg-brand-bg-secondary pt-24">
      {/* Narrative Section */}
      <StorySection />

      {/* Masonry visual gallery of legacy dishes */}
      <GallerySection />

      {/* Critical acclaim & customer reviews */}
      <ReviewsSection />
    </div>
  );
}
