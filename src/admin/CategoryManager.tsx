/**
 * CategoryManager.tsx
 * Management interface for Menu Categories.
 * Provides Add, Edit, Delete, Active Toggling, and Sort Order controls.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Check, X, Loader2, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { getCategories, addCategory, updateCategory, deleteCategory, reorderCategories } from '../services/categoryService';
import { uploadImage, compressImage } from '../services/storageService';
import type { Category } from '../types';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = getCategories((data) => {
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setName('');
    setImageFile(null);
    setImageUrl('');
    setSortOrder(categories.length);
    setIsActive(true);
    setCurrentCategory(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setCurrentCategory(cat);
    setName(cat.name);
    setImageUrl(cat.image);
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      try {
        const file = acceptedFiles[0];
        const compressed = await compressImage(file, 600, 0.7);
        setImageFile(compressed);
        // Create local preview URL
        setImageUrl(URL.createObjectURL(compressed));
      } catch (err) {
        toast.error('Failed to process image');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      let finalImageUrl = imageUrl;

      // Upload image if selected
      if (imageFile) {
        const path = `category-images/${Date.now()}-${imageFile.name}`;
        finalImageUrl = await uploadImage(imageFile, path);
      }

      if (!finalImageUrl) {
        toast.error('Please upload an image for the category');
        setSubmitting(false);
        return;
      }

      const categoryData = {
        name,
        image: finalImageUrl,
        sortOrder: Number(sortOrder),
        isActive,
      };

      if (currentCategory) {
        await updateCategory(currentCategory.id, categoryData);
        toast.success('Category updated successfully');
      } else {
        await addCategory(categoryData);
        toast.success('Category added successfully');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error('Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      await deleteCategory(selectedDeleteId);
      toast.success('Category deleted successfully');
      setIsDeleteConfirmOpen(false);
      setSelectedDeleteId(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      toast.success(`${cat.name} is now ${!cat.isActive ? 'active' : 'inactive'}`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newItems = [...categories];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;

    // Map new sortOrder
    const payload = newItems.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));

    try {
      await reorderCategories(payload);
      toast.success('Sort order updated');
    } catch {
      toast.error('Failed to reorder categories');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newItems = [...categories];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;

    const payload = newItems.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));

    try {
      await reorderCategories(payload);
      toast.success('Sort order updated');
    } catch {
      toast.error('Failed to reorder categories');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-48 h-6 rounded bg-brand-bg-secondary animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-brand-bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-brand-card border border-brand-divider rounded-xl p-4 space-y-4">
              <div className="w-full h-32 rounded bg-brand-bg-secondary" />
              <div className="w-2/3 h-5 rounded bg-brand-bg-secondary" />
              <div className="w-1/2 h-4 rounded bg-brand-bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl text-white">Categories</h1>
          <p className="text-xs text-slate-400">Manage menu categories and sorting</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 border border-slate-700/50">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 text-sm">No categories found</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Sort Order</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-10 h-10 object-cover rounded-sm border border-slate-700"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{cat.name}</td>
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>{cat.sortOrder}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-500"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === categories.length - 1}
                            className="text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-500"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`px-2.5 py-1 border text-[10px] uppercase font-semibold tracking-wider ${
                          cat.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-400 border border-slate-700 rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDeleteId(cat.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl overflow-hidden z-10"
            >
              <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg text-white">
                    {currentCategory ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category Name */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Indian Curries"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Drag-and-drop Image Upload */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[10px] mb-2">
                      Category Image
                    </label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-650'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {imageUrl ? (
                        <div className="relative group">
                          <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded border border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                            <span className="text-[10px] uppercase font-semibold text-white tracking-widest">
                              Change Image
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="text-slate-400 text-xs font-sans">
                            Drag & drop image here, or <span className="text-amber-400 font-medium">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-500">Supports JPEG, PNG, WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between py-2 border-t border-slate-800">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                      Active Status
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-amber-500' : 'bg-slate-750'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                          isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3 text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : currentCategory ? (
                      'Save Changes'
                    ) : (
                      'Create Category'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-sm w-full shadow-2xl z-10"
            >
              <h3 className="font-serif text-lg text-white mb-2">Delete Category?</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Are you sure you want to delete this category? This action is permanent and cannot be undone. Menu items belonging to this category will not be deleted, but they will be left uncategorized.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
