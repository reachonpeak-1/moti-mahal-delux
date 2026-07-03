/**
 * MenuManager.tsx
 * Menu item CRUD page with card grid layout, add/edit modal form,
 * image upload via dropzone, availability toggle, and delete confirmation.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  ChefHat,
  Flame,
  Clock,
  Leaf,
  Star,
  AlertTriangle,
  Check,
  Sparkles,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { MenuItem, Category } from '../types';
import toast from 'react-hot-toast';

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Starters', image: '', sortOrder: 1, isActive: true },
  { id: 'cat2', name: 'Main Course', image: '', sortOrder: 2, isActive: true },
  { id: 'cat3', name: 'Breads', image: '', sortOrder: 3, isActive: true },
  { id: 'cat4', name: 'Biryani', image: '', sortOrder: 4, isActive: true },
  { id: 'cat5', name: 'Desserts', image: '', sortOrder: 5, isActive: true },
  { id: 'cat6', name: 'Beverages', image: '', sortOrder: 6, isActive: true },
];

const MOCK_MENU: MenuItem[] = [
  { id: 'mi1', name: 'Butter Chicken', description: 'Tender chicken in rich buttery tomato gravy', price: 450, image: '', category: 'Main Course', calories: 420, spiceLevel: 2, prepTime: '25 min', isBestSeller: true, isChefSpecial: false, isTodaySpecial: false, isVegetarian: false, ingredients: ['Chicken', 'Butter', 'Tomato', 'Cream'], allergens: ['Dairy'], nutritionalInfo: { protein: '28g', carbs: '12g', fat: '18g' }, isAvailable: true, sortOrder: 1 },
  { id: 'mi2', name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled to perfection', price: 380, image: '', category: 'Starters', calories: 310, spiceLevel: 2, prepTime: '20 min', isBestSeller: false, isChefSpecial: true, isTodaySpecial: false, isVegetarian: true, ingredients: ['Paneer', 'Yogurt', 'Spices'], allergens: ['Dairy'], nutritionalInfo: { protein: '18g', carbs: '8g', fat: '22g' }, isAvailable: true, sortOrder: 2 },
  { id: 'mi3', name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy gravy', price: 320, image: '', category: 'Main Course', calories: 350, spiceLevel: 1, prepTime: '30 min', isBestSeller: true, isChefSpecial: false, isTodaySpecial: true, isVegetarian: true, ingredients: ['Black Lentils', 'Butter', 'Cream', 'Tomato'], allergens: ['Dairy'], nutritionalInfo: { protein: '15g', carbs: '28g', fat: '14g' }, isAvailable: true, sortOrder: 3 },
  { id: 'mi4', name: 'Tandoori Roti', description: 'Traditional clay oven baked bread', price: 40, image: '', category: 'Breads', calories: 120, spiceLevel: 0, prepTime: '5 min', isVegetarian: true, ingredients: ['Wheat Flour'], allergens: ['Gluten'], nutritionalInfo: { protein: '4g', carbs: '22g', fat: '2g' }, isAvailable: true, sortOrder: 4 },
  { id: 'mi5', name: 'Biryani Special', description: 'Fragrant basmati rice with tender meat and aromatic spices', price: 550, image: '', category: 'Biryani', calories: 580, spiceLevel: 3, prepTime: '45 min', isBestSeller: true, isChefSpecial: true, isVegetarian: false, ingredients: ['Basmati Rice', 'Chicken', 'Spices', 'Saffron'], allergens: [], nutritionalInfo: { protein: '32g', carbs: '45g', fat: '20g' }, isAvailable: false, sortOrder: 5 },
  { id: 'mi6', name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-flavored sugar syrup', price: 180, image: '', category: 'Desserts', calories: 290, spiceLevel: 0, prepTime: '10 min', isVegetarian: true, ingredients: ['Milk Powder', 'Sugar', 'Rose Water'], allergens: ['Dairy'], nutritionalInfo: { protein: '4g', carbs: '38g', fat: '10g' }, isAvailable: true, sortOrder: 6 },
];

const SPICE_LABELS = ['None', 'Mild', 'Spicy', 'Very Spicy'];
const SPICE_COLORS = ['text-slate-400', 'text-green-400', 'text-amber-400', 'text-rose-400'];

// ─── Empty Form ─────────────────────────────────────────────────
const emptyItem: Omit<MenuItem, 'id'> = {
  name: '',
  description: '',
  price: 0,
  image: '',
  category: '',
  calories: 0,
  spiceLevel: 0,
  prepTime: '',
  isBestSeller: false,
  isChefSpecial: false,
  isTodaySpecial: false,
  isVegetarian: false,
  ingredients: [],
  allergens: [],
  nutritionalInfo: { protein: '', carbs: '', fat: '' },
  chefRecommendation: '',
  isAvailable: true,
  sortOrder: 0,
};

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>(emptyItem);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState('');
  const [allergenInput, setAllergenInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(MOCK_MENU);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (availabilityFilter === 'in-stock' && !item.isAvailable) return false;
      if (availabilityFilter === 'out-of-stock' && item.isAvailable) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [items, categoryFilter, availabilityFilter, search]);

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  } as any);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(emptyItem);
    setImagePreview(null);
    setIngredientInput('');
    setAllergenInput('');
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setImagePreview(item.image || null);
    setIngredientInput('');
    setAllergenInput('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter item name');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...formData, id: editingItem.id, updatedAt: new Date().toISOString() } : i))
      );
      toast.success(`"${formData.name}" updated successfully`);
    } else {
      const newItem: MenuItem = {
        ...formData,
        id: `mi_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      toast.success(`"${formData.name}" added successfully`);
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" deleted`);
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const toggleAvailability = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i))
    );
    const item = items.find((i) => i.id === itemId);
    if (item) {
      toast.success(`"${item.name}" is now ${item.isAvailable ? 'out of stock' : 'available'}`);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      const newIngredients = ingredientInput.split(',').map((s) => s.trim()).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ...newIngredients],
      }));
      setIngredientInput('');
    }
  };

  const addAllergen = () => {
    if (allergenInput.trim()) {
      const newAllergens = allergenInput.split(',').map((s) => s.trim()).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        allergens: [...prev.allergens, ...newAllergens],
      }));
      setAllergenInput('');
    }
  };

  const removeTag = (field: 'ingredients' | 'allergens', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white">Menu Items</h1>
          <p className="text-slate-400 mt-1">Manage your restaurant's menu</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-semibold text-sm hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Availability</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-divider rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-brand-bg-secondary" />
              <div className="p-4 space-y-3">
                <div className="w-3/4 h-5 rounded bg-brand-bg-secondary" />
                <div className="w-1/2 h-4 rounded bg-brand-bg-secondary" />
                <div className="w-1/3 h-6 rounded bg-brand-bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <ChefHat className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No menu items found</h3>
          <p className="text-slate-400 text-sm text-center mb-4">
            {search || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Start by adding your first dish'}
          </p>
          {!search && categoryFilter === 'all' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-brand-card border rounded-xl overflow-hidden hover:border-brand-gold/30 hover:-translate-y-0.5 transition-all duration-300 group ${
                !item.isAvailable ? 'border-brand-divider opacity-75' : 'border-brand-divider'
              }`}
            >
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-[#F7F4EE] to-[#EFE8DD] flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat className="w-10 h-10 text-[#C5A880]/50" />
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {item.isBestSeller && (
                    <span className="text-[8px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-brand-gold text-white">
                      Bestseller
                    </span>
                  )}
                  {item.isChefSpecial && (
                    <span className="text-[8px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-[#7C6552] text-white">
                      Chef's Pick
                    </span>
                  )}
                  {item.isTodaySpecial && (
                    <span className="text-[8px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-brand-bronze text-white">
                      Today
                    </span>
                  )}
                </div>
                {item.isVegetarian && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-[2px] border border-green-500/50 flex items-center justify-center bg-white">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="text-[8px] font-bold tracking-widest uppercase text-rose-500 bg-white border border-rose-500/25 px-2.5 py-1 rounded-[2px]">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-serif font-bold text-brand-text-primary leading-tight truncate pr-2">
                    {item.name}
                  </h3>
                  <p className="text-sm font-serif font-bold text-[#C9A96E] flex-shrink-0">
                    ₹{item.price}
                  </p>
                </div>
                <p className="text-xs text-brand-text-secondary mb-3 line-clamp-2">{item.description}</p>

                <div className="flex items-center gap-3 mb-3 text-[10px] text-brand-text-secondary">
                  <span className="flex items-center gap-1">
                    <Flame className={`w-3 h-3 ${SPICE_COLORS[item.spiceLevel]}`} />
                    {SPICE_LABELS[item.spiceLevel]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-text-muted" />
                    {item.prepTime}
                  </span>
                  <span className="text-brand-text-muted">{item.calories} cal</span>
                </div>

                {/* Category badge */}
                <span className="inline-block text-[8px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-[2px] bg-brand-bg-secondary text-brand-text-secondary border border-brand-divider mb-3">
                  {item.category}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-brand-divider">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`relative w-8 h-4.5 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      item.isAvailable ? 'bg-emerald-500' : 'bg-brand-divider'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm ${
                        item.isAvailable ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[10px] text-brand-text-secondary flex-1 ml-1">
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded text-brand-text-secondary hover:text-brand-gold hover:bg-brand-hover transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(item); setShowDeleteDialog(true); }}
                    className="p-1.5 rounded text-brand-text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl my-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Item Image</label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, image: '' }));
                          }}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload className="w-8 h-8" />
                        <p className="text-sm">Drop image here or click to upload</p>
                        <p className="text-xs text-slate-500">JPG, PNG, WEBP up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. Butter Chicken"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                        placeholder="450"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    placeholder="Describe the dish..."
                  />
                </div>

                {/* Category + Calories + Prep Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {categories.filter((c) => c.isActive).map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Calories</label>
                    <input
                      type="number"
                      value={formData.calories || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, calories: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      placeholder="420"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prep Time</label>
                    <input
                      type="text"
                      value={formData.prepTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, prepTime: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      placeholder="25 min"
                    />
                  </div>
                </div>

                {/* Spice Level Slider */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Spice Level:{' '}
                    <span className={SPICE_COLORS[formData.spiceLevel]}>
                      {SPICE_LABELS[formData.spiceLevel]}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    value={formData.spiceLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, spiceLevel: Number(e.target.value) as 0 | 1 | 2 | 3 }))
                    }
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    {SPICE_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'isBestSeller', label: 'Best Seller', icon: Star },
                    { key: 'isChefSpecial', label: 'Chef Special', icon: ChefHat },
                    { key: 'isTodaySpecial', label: 'Today Special', icon: Sparkles },
                    { key: 'isVegetarian', label: 'Vegetarian', icon: Leaf },
                  ].map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                        formData[key as keyof typeof formData]
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!formData[key as keyof typeof formData]}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="hidden"
                      />
                      <Icon className={`w-4 h-4 ${formData[key as keyof typeof formData] ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className={`text-xs font-medium ${formData[key as keyof typeof formData] ? 'text-amber-400' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Ingredients Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Ingredients</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      placeholder="Add ingredients (comma separated)"
                    />
                    <button
                      onClick={addIngredient}
                      className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {formData.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-lg"
                        >
                          {ing}
                          <button onClick={() => removeTag('ingredients', i)} className="text-slate-500 hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allergens Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Allergens</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={allergenInput}
                      onChange={(e) => setAllergenInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      placeholder="Add allergens (comma separated)"
                    />
                    <button
                      onClick={addAllergen}
                      className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {formData.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.allergens.map((alg, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-xs bg-rose-500/15 text-rose-400 px-2 py-1 rounded-lg"
                        >
                          {alg}
                          <button onClick={() => removeTag('allergens', i)} className="text-rose-500/60 hover:text-rose-300">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nutritional Info */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nutritional Info</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Protein</label>
                      <input
                        type="text"
                        value={formData.nutritionalInfo.protein}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, protein: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                        placeholder="28g"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Carbs</label>
                      <input
                        type="text"
                        value={formData.nutritionalInfo.carbs}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, carbs: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                        placeholder="12g"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fat</label>
                      <input
                        type="text"
                        value={formData.nutritionalInfo.fat}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nutritionalInfo: { ...prev.nutritionalInfo, fat: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                        placeholder="18g"
                      />
                    </div>
                  </div>
                </div>

                {/* Chef Recommendation */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Chef Recommendation (Optional)</label>
                  <textarea
                    value={formData.chefRecommendation || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, chefRecommendation: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    placeholder="What does the chef recommend pairing with this dish?"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-semibold text-sm hover:from-amber-400 hover:to-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation ─────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteDialog && deleteTarget && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowDeleteDialog(false); setDeleteTarget(null); }}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Item</h3>
                  <p className="text-sm text-slate-400">"{deleteTarget.name}"</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to delete this menu item? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteDialog(false); setDeleteTarget(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
