/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import CategoryNav from '../components/CategoryNav';
import MenuItemCard from '../components/MenuItemCard';
import { MenuItem, CartItem, Category } from '../types';
import { CATEGORIES, FAMILY_COMBOS } from '../data';
import { ChefHat, ShoppingBag, Search } from 'lucide-react';

interface MenuViewProps {
  activeCategory: string;
  setActiveCategory: (catId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMenuItems: MenuItem[];
  chefSpecials: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem, e?: React.MouseEvent) => void;
  categories?: Category[];
}

export default function MenuView({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  filteredMenuItems,
  chefSpecials,
  onSelectItem,
  onAddToCart,
  categories
}: MenuViewProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset page when category or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const totalItems = filteredMenuItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredMenuItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Pagination page range generator
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    const element = document.getElementById('filtered-menu-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="menu-view-stage" className="space-y-16 pt-24 pb-12">
      {/* Dynamic Filter Navigation Tabs Sticky Offset */}
      <div>
        <CategoryNav
          activeCategory={activeCategory}
          categories={categories}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            const element = document.getElementById('filtered-menu-grid');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 space-y-24">
        {/* Search input if they want to filter locally in real time */}
        <div className="max-w-md mx-auto relative flex items-center border border-brand-divider p-2 bg-brand-card">
          <Search size={16} className="text-brand-text-secondary ml-2 mr-3" />
          <input
            type="text"
            placeholder="Search through recipes, spices, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-brand-text-primary font-sans text-xs focus:outline-none py-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="font-sans text-[10px] tracking-wider text-brand-gold uppercase hover:text-brand-text-primary px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* 1. Chef Recommendations Block (Show when unfiltered) */}
        {activeCategory === 'all' && searchQuery === '' && (
          <section id="chef-recommendations" className="space-y-12 bg-brand-card p-8 md:p-12 border border-brand-divider relative">
            <div className="absolute inset-2 border border-brand-gold/10 pointer-events-none" />
            
            <div className="text-center max-w-xl mx-auto space-y-3 relative z-10">
              <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">CRAFTED DAILY</span>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-brand-text-primary tracking-wide">
                The Chef’s Personal Heritage Selections
              </h2>
              <p className="font-sans text-xs text-brand-text-secondary leading-relaxed max-w-sm mx-auto">
                Master compositions of pure spices and patience, designed to represent the pinnacle of fine tandoori craft.
              </p>
            </div>

            <div 
              className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-6 scrollbar-none md:-mx-8 md:px-8 lg:grid lg:grid-cols-3 lg:space-x-0 lg:gap-8 lg:mx-0 lg:px-0 relative z-10"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {chefSpecials.slice(0, 3).map((item) => (
                <div key={item.id} className="w-[80vw] sm:w-[48vw] lg:w-auto flex-shrink-0">
                  <MenuItemCard
                    item={item}
                    onSelectItem={onSelectItem}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Filtered Complete Menu Display */}
        <section id="filtered-menu-grid" className="space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-brand-divider pb-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">CULINARY INDEX</span>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-text-primary tracking-wide">
                {activeCategory === 'all' ? 'All Masterpieces' : CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h3>
            </div>

            <div className="flex items-center space-x-3">
              {totalPages > 1 && (
                <span className="font-sans text-[10px] text-brand-text-secondary tracking-wider uppercase bg-brand-bg-secondary/40 py-1 px-3">
                  Page {currentPage} of {totalPages}
                </span>
              )}
              <span className="font-mono text-xs text-brand-text-secondary bg-brand-bg-secondary py-1 px-3">
                Found {filteredMenuItems.length} elegant dishes
              </span>
            </div>
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-16 space-y-3 border border-dashed border-brand-divider">
              <p className="font-serif text-lg italic text-brand-text-secondary">No heritage dishes matched your query.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="font-sans text-[10px] tracking-widest uppercase border border-brand-text-primary py-2 px-5 hover:bg-brand-text-primary hover:text-brand-surface transition-all duration-300"
              >
                Reset Culinary Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {paginatedItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelectItem={onSelectItem}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {/* Elegant Pagination Indicators */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-8 border-t border-brand-divider">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`font-sans text-[9px] tracking-widest uppercase py-2 px-4 border border-brand-divider transition-all duration-300 ${
                      currentPage === 1
                        ? 'opacity-30 cursor-not-allowed text-brand-text-secondary'
                        : 'text-brand-text-primary hover:bg-brand-text-primary hover:text-brand-surface'
                    }`}
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-8 w-8 font-mono text-xs transition-all duration-300 border ${
                          currentPage === pageNum
                            ? 'bg-brand-text-primary text-brand-surface border-brand-text-primary font-bold'
                            : 'border-brand-divider text-brand-text-secondary hover:bg-brand-bg-secondary hover:text-brand-text-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`font-sans text-[9px] tracking-widest uppercase py-2 px-4 border border-brand-divider transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'opacity-30 cursor-not-allowed text-brand-text-secondary'
                        : 'text-brand-text-primary hover:bg-brand-text-primary hover:text-brand-surface'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 3. Family Combos Section (Curated multi-sharing feasts) */}
        {activeCategory === 'all' && searchQuery === '' && (
          <section id="family-combos" className="space-y-12 border-t border-brand-divider pt-20">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="font-sans text-[10px] tracking-[0.4em] text-brand-gold uppercase block">SOVEREIGN BANQUETS</span>
              <h2 className="font-serif text-3xl font-light text-brand-text-primary tracking-wide">
                Multi-Diner Family Combos
              </h2>
              <p className="font-sans text-xs text-brand-text-secondary leading-relaxed">
                Exquisitely orchestrated complete feasts designed for shared memories and effortless celebration.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {FAMILY_COMBOS.map((combo) => (
                <div
                  key={combo.id}
                  className="border border-brand-divider bg-brand-card flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition-all duration-500"
                >
                  {/* Left: Combo Image */}
                  <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden bg-brand-bg-secondary">
                    <img
                      src={combo.image}
                      alt={combo.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-103 transition-transform duration-700"
                    />
                    <span className="absolute bottom-4 left-4 bg-brand-gold text-brand-surface text-[8px] font-sans font-bold tracking-widest uppercase px-2 py-1 shadow-md">
                      {combo.savings}
                    </span>
                  </div>

                  {/* Right: Info details */}
                  <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-serif text-lg md:text-xl font-medium tracking-wide text-brand-text-primary leading-tight">
                        {combo.name}
                      </h4>
                      <p className="font-sans text-xs text-brand-text-secondary leading-relaxed line-clamp-4">
                        {combo.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-brand-divider pt-6 mt-6">
                      <div>
                        <span className="font-sans text-[8px] tracking-wider text-brand-text-muted uppercase">VALUE FEAST</span>
                        <span className="block font-mono text-lg font-bold text-brand-text-primary">₹{combo.price.toFixed(2)}</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const virtualItem: MenuItem = {
                            id: combo.id,
                            name: combo.name,
                            description: combo.description,
                            price: combo.price,
                            image: combo.image,
                            category: 'curries',
                            calories: 2400,
                            spiceLevel: 1,
                            prepTime: '30 mins',
                            isVegetarian: combo.id.includes('veg'),
                            ingredients: ['Curated multiple selections', 'Naan assortment', 'Drinks'],
                            allergens: ['Dairy', 'Wheat', 'Nuts'],
                            nutritionalInfo: { protein: '120g', carbs: '280g', fat: '150g' }
                          };
                          onAddToCart(virtualItem);
                        }}
                        className="bg-brand-text-primary hover:bg-brand-gold text-brand-surface font-sans text-[10px] tracking-widest uppercase py-3 px-5 transition-all duration-300 focus:outline-none"
                      >
                        Order Feast
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
