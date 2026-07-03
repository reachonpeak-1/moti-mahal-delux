/**
 * SettingsManager.tsx
 * Management interface for Restaurant Settings.
 * Multi-tab layout for: General, Operating Hours, Delivery, Tax, Hero Banners, and Gallery.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Save, Clock, MapPin, Percent, Image as ImageIcon, Plus, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../services/settingsService';
import { uploadImage } from '../services/storageService';
import type { RestaurantSettings, OperatingHour, HeroSlide, GalleryPhoto } from '../types';

type Tab = 'general' | 'hours' | 'delivery' | 'tax' | 'hero' | 'gallery';

const DEFAULT_SETTINGS: RestaurantSettings = {
  id: 'restaurant',
  restaurantName: 'Moti Mahal Delux',
  address: '55 Heritage Avenue, Diplomatic Enclave, New Delhi, India',
  phone: '+1 (800) 1920-DELUX',
  email: 'hospitality@motimahal.com',
  operatingHours: {
    mon: { open: '12:00', close: '23:30', isClosed: false },
    tue: { open: '12:00', close: '23:30', isClosed: false },
    wed: { open: '12:00', close: '23:30', isClosed: false },
    thu: { open: '12:00', close: '23:30', isClosed: false },
    fri: { open: '12:00', close: '23:30', isClosed: false },
    sat: { open: '12:00', close: '23:30', isClosed: false },
    sun: { open: '12:00', close: '23:30', isClosed: false },
  },
  isOpen: true,
  closedMessage: 'Our kitchen hearth is temporarily resting. We will open shortly.',
  deliveryZone: 'Dabwali Gurumukhi Chowk Bathinda to AIIMS',
  deliveryFee: 0,
  freeDelivery: true,
  minOrderForDelivery: 100,
  heroSliders: [],
  galleryPhotos: [],
  taxConfig: {
    gst: 5,
    serviceCharge: 0,
  },
  whatsappPhone: '+91 98765 43210',
  whatsappMessage: 'Hello! I would like to make an inquiry.',
  instagramUsername: 'gkregency_bathinda',
  googleMapsUrl: 'https://www.google.co.in/maps/place/G.K+Regency/@30.1801981,74.9389857,17z/data=!3m1!4b1!4m9!3m8!1s0x39172d0010c5f109:0x4b03d5773f4aec5f!5m2!4m1!1i2!8m2!3d30.1801981!4d74.9415606!16s%2Fg%2F11w3nwkgl2',
};

export default function SettingsManager() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);

  // General tab state
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Hours tab state
  const [operatingHours, setOperatingHours] = useState<Record<string, OperatingHour>>({});
  const [isOpenOverride, setIsOpenOverride] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');

  // Delivery tab state
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(true);
  const [minOrderForDelivery, setMinOrderForDelivery] = useState(0);

  // Tax tab state
  const [gstPercent, setGstPercent] = useState(5);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);

  // Hero slide state
  const [heroSliders, setHeroSliders] = useState<HeroSlide[]>([]);
  const [newSlideHeadline, setNewSlideHeadline] = useState('');
  const [newSlideSubline, setNewSlideSubline] = useState('');
  const [newSlideFile, setNewSlideFile] = useState<File | null>(null);
  const [newSlidePreview, setNewSlidePreview] = useState('');
  const [uploadingSlide, setUploadingSlide] = useState(false);

  // Gallery state
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    const unsub = getSettings((data) => {
      if (data) {
        setSettings(data);
        // Bind general
        setRestaurantName(data.restaurantName);
        setAddress(data.address);
        setPhone(data.phone);
        setEmail(data.email);
        setWhatsappPhone(data.whatsappPhone || '');
        setWhatsappMessage(data.whatsappMessage || '');
        setInstagramUsername(data.instagramUsername || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
        // Bind hours
        setOperatingHours(data.operatingHours);
        setIsOpenOverride(data.isOpen);
        setClosedMessage(data.closedMessage);
        // Bind delivery
        setDeliveryZone(data.deliveryZone);
        setDeliveryFee(data.deliveryFee);
        setFreeDelivery(data.freeDelivery);
        setMinOrderForDelivery(data.minOrderForDelivery);
        // Bind tax
        setGstPercent(data.taxConfig.gst);
        setServiceChargePercent(data.taxConfig.serviceCharge);
        // Bind media
        setHeroSliders(data.heroSliders || []);
        setGalleryPhotos(data.galleryPhotos || []);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async (updates: Partial<RestaurantSettings>) => {
    try {
      setSaving(true);
      await updateSettings(updates);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneral = () => {
    handleSaveSettings({
      restaurantName,
      address,
      phone,
      email,
      whatsappPhone,
      whatsappMessage,
      instagramUsername,
      googleMapsUrl,
    });
  };

  const handleSaveHours = () => {
    handleSaveSettings({
      operatingHours: operatingHours as any,
      isOpen: isOpenOverride,
      closedMessage,
    });
  };

  const handleSaveDelivery = () => {
    handleSaveSettings({
      deliveryZone,
      deliveryFee: Number(deliveryFee),
      freeDelivery,
      minOrderForDelivery: Number(minOrderForDelivery),
    });
  };

  const handleSaveTax = () => {
    handleSaveSettings({
      taxConfig: {
        gst: Number(gstPercent),
        serviceCharge: Number(serviceChargePercent),
      },
    });
  };

  // Hero slides upload
  const onDropHero = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setNewSlideFile(file);
      setNewSlidePreview(URL.createObjectURL(file));
    }
  };

  const { getRootProps: getHeroRootProps, getInputProps: getHeroInputProps } = useDropzone({
    onDrop: onDropHero,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleAddHeroSlide = async () => {
    if (!newSlideFile || !newSlideHeadline.trim()) {
      toast.error('Slide headline and image are required');
      return;
    }

    try {
      setUploadingSlide(true);
      const path = `hero-sliders/${Date.now()}-${newSlideFile.name}`;
      const downloadUrl = await uploadImage(newSlideFile, path);

      const newSlide: HeroSlide = {
        id: `slide-${Date.now()}`,
        image: downloadUrl,
        headline: newSlideHeadline,
        subline: newSlideSubline,
        sortOrder: heroSliders.length,
      };

      const updatedSliders = [...heroSliders, newSlide];
      setHeroSliders(updatedSliders);
      await handleSaveSettings({ heroSliders: updatedSliders });
      
      // Reset input
      setNewSlideFile(null);
      setNewSlidePreview('');
      setNewSlideHeadline('');
      setNewSlideSubline('');
      toast.success('Hero slide added');
    } catch {
      toast.error('Failed to add hero slide');
    } finally {
      setUploadingSlide(false);
    }
  };

  const handleDeleteHeroSlide = async (slideId: string) => {
    const updated = heroSliders.filter((s) => s.id !== slideId);
    setHeroSliders(updated);
    await handleSaveSettings({ heroSliders: updated });
    toast.success('Hero slide removed');
  };

  // Gallery uploads
  const onDropGallery = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setGalleryFile(file);
      setGalleryPreview(URL.createObjectURL(file));
    }
  };

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps } = useDropzone({
    onDrop: onDropGallery,
    accept: { 'image/*': [] },
    multiple: false,
  } as any);

  const handleAddGalleryPhoto = async () => {
    if (!galleryFile) {
      toast.error('Gallery image file is required');
      return;
    }

    try {
      setUploadingGallery(true);
      const path = `gallery/${Date.now()}-${galleryFile.name}`;
      const downloadUrl = await uploadImage(galleryFile, path);

      const newPhoto: GalleryPhoto = {
        id: `photo-${Date.now()}`,
        url: downloadUrl,
        caption: galleryCaption,
        sortOrder: galleryPhotos.length,
      };

      const updatedPhotos = [...galleryPhotos, newPhoto];
      setGalleryPhotos(updatedPhotos);
      await handleSaveSettings({ galleryPhotos: updatedPhotos });
      
      // Reset input
      setGalleryFile(null);
      setGalleryPreview('');
      setGalleryCaption('');
      toast.success('Gallery photo uploaded');
    } catch {
      toast.error('Failed to upload gallery photo');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: string) => {
    const updated = galleryPhotos.filter((p) => p.id !== photoId);
    setGalleryPhotos(updated);
    await handleSaveSettings({ galleryPhotos: updated });
    toast.success('Gallery photo removed');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General Info', icon: <MapPin size={14} /> },
    { key: 'hours', label: 'Hours', icon: <Clock size={14} /> },
    { key: 'delivery', label: 'Delivery Settings', icon: <MapPin size={14} /> },
    { key: 'tax', label: 'GST & Service Charge', icon: <Percent size={14} /> },
    { key: 'hero', label: 'Hero Slides', icon: <ImageIcon size={14} /> },
    { key: 'gallery', label: 'Centenary Gallery', icon: <ImageIcon size={14} /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="w-48 h-6 rounded bg-brand-bg-secondary animate-pulse mb-2" />
          <div className="w-72 h-4 rounded bg-brand-bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-pulse">
          <div className="bg-brand-card border border-brand-divider rounded-xl p-4 space-y-3 h-fit">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-8 rounded bg-brand-bg-secondary" />
            ))}
          </div>
          <div className="lg:col-span-3 bg-brand-card border border-brand-divider rounded-xl p-6 space-y-5">
            <div className="w-1/3 h-6 rounded bg-brand-bg-secondary" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="w-20 h-4 rounded bg-brand-bg-secondary" />
                  <div className="w-full h-10 rounded bg-brand-bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-white">Settings</h1>
        <p className="text-xs text-slate-400">Configure restaurant metadata, operating timings, taxes, and banners</p>
      </div>

      {/* Settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 h-fit flex flex-row lg:flex-col overflow-x-auto gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2.5 px-4 py-3 text-xs uppercase tracking-wider transition-all rounded whitespace-nowrap lg:w-full ${
                activeTab === t.key
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content panel */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <AnimatePresence mode="wait">
            {/* GENERAL INFO */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <h3 className="font-serif text-base text-white border-b border-slate-800 pb-3">
                  General Restaurant Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    Inquiry Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    Physical Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      WhatsApp Phone Number (e.g. +919876543210)
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. +919876543210"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Instagram Username (without @)
                    </label>
                    <input
                      type="text"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder="e.g. gkregency_bathinda"
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    WhatsApp Prefilled Message
                  </label>
                  <input
                    type="text"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="e.g. Hello! I would like to make an inquiry."
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    Google Maps URL
                  </label>
                  <input
                    type="text"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="Google Maps sharing/place link"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Info
                  </button>
                </div>
              </motion.div>
            )}

            {/* OPERATING HOURS */}
            {activeTab === 'hours' && (
              <motion.div
                key="hours"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-serif text-base text-white">Operating Hours Configuration</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">
                      Hearth Status (Force Open)
                    </span>
                    <button
                      onClick={() => setIsOpenOverride(!isOpenOverride)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isOpenOverride ? 'bg-amber-500' : 'bg-slate-750'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                          isOpenOverride ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Days settings */}
                <div className="space-y-3">
                  {(Object.entries(operatingHours) as [string, OperatingHour][]).map(([day, hour]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-950/40 border border-slate-850 rounded">
                      <span className="font-semibold text-white uppercase tracking-wider w-24 capitalize">{day}</span>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Open</span>
                          <input
                            type="time"
                            value={hour.open}
                            disabled={hour.isClosed}
                            onChange={(e) =>
                              setOperatingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], open: e.target.value },
                              }))
                            }
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none disabled:opacity-30"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Close</span>
                          <input
                            type="time"
                            value={hour.close}
                            disabled={hour.isClosed}
                            onChange={(e) =>
                              setOperatingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], close: e.target.value },
                              }))
                            }
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none disabled:opacity-30"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 ml-2">
                          <input
                            type="checkbox"
                            checked={hour.isClosed}
                            id={`closed-${day}`}
                            onChange={(e) =>
                              setOperatingHours((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], isClosed: e.target.checked },
                              }))
                            }
                            className="rounded border-slate-750 bg-slate-800 text-amber-500 focus:ring-amber-500/20"
                          />
                          <label htmlFor={`closed-${day}`} className="text-slate-400 font-medium">Closed</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Closed Message */}
                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    Restaurant Closed Display Message (when ordering disabled)
                  </label>
                  <input
                    type="text"
                    value={closedMessage}
                    onChange={(e) => setClosedMessage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveHours}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Schedule
                  </button>
                </div>
              </motion.div>
            )}

            {/* DELIVERY SETTINGS */}
            {activeTab === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <h3 className="font-serif text-base text-white border-b border-slate-800 pb-3">
                  Delivery Zone & Charges
                </h3>
                
                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                    Delivery Coverage Area Name (Zone description)
                  </label>
                  <input
                    type="text"
                    value={deliveryZone}
                    onChange={(e) => setDeliveryZone(e.target.value)}
                    placeholder="e.g. Dabwali Gurumukhi Chowk Bathinda to AIIMS"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Delivery Fee */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Delivery Charge (₹)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      disabled={freeDelivery}
                      onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                    />
                  </div>

                  {/* Min Order for Delivery */}
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Min. Order Value for Delivery (₹)
                    </label>
                    <input
                      type="number"
                      value={minOrderForDelivery}
                      onChange={(e) => setMinOrderForDelivery(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Free Delivery Toggle */}
                  <div className="flex flex-col justify-end pb-1">
                    <div className="flex items-center justify-between p-2.5 bg-slate-800 border border-slate-700 rounded">
                      <span className="text-slate-400 font-medium">Free Delivery Always</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFreeDelivery(!freeDelivery);
                          if (!freeDelivery) setDeliveryFee(0);
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          freeDelivery ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 transition-transform ${
                            freeDelivery ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveDelivery}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Delivery
                  </button>
                </div>
              </motion.div>
            )}

            {/* GST & TAX CONFIG */}
            {activeTab === 'tax' && (
              <motion.div
                key="tax"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <h3 className="font-serif text-base text-white border-b border-slate-800 pb-3">
                  Taxes & Service Surcharges
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Government GST (%)
                    </label>
                    <input
                      type="number"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-2">
                      Restaurant Service Charge (%)
                    </label>
                    <input
                      type="number"
                      value={serviceChargePercent}
                      onChange={(e) => setServiceChargePercent(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveTax}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Taxes
                  </button>
                </div>
              </motion.div>
            )}

            {/* HERO BANNER SLIDES */}
            {activeTab === 'hero' && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 text-xs"
              >
                <h3 className="font-serif text-base text-white border-b border-slate-800 pb-3">
                  Home Hero Banner Slides
                </h3>

                {/* Grid of current slides */}
                {heroSliders.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {heroSliders.map((slide) => (
                      <div key={slide.id} className="bg-slate-950 p-4 border border-slate-850 rounded relative group">
                        <img
                          src={slide.image}
                          alt={slide.headline}
                          className="w-full h-32 object-cover border border-slate-800 mb-2 rounded"
                        />
                        <h4 className="font-serif font-bold text-white mb-0.5">{slide.headline}</h4>
                        <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-2">{slide.subline}</p>
                        
                        <button
                          onClick={() => handleDeleteHeroSlide(slide.id)}
                          className="absolute top-6 right-6 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new slide panel */}
                <div className="bg-slate-950/60 p-4 border border-slate-850 rounded space-y-4">
                  <h4 className="font-semibold text-white uppercase tracking-wider text-[10px]">Add New Slide</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Selector */}
                    <div
                      {...getHeroRootProps()}
                      className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900 rounded p-6 text-center cursor-pointer flex flex-col justify-center"
                    >
                      <input {...getHeroInputProps()} />
                      {newSlidePreview ? (
                        <img src={newSlidePreview} alt="Preview" className="w-full h-24 object-cover border border-slate-800" />
                      ) : (
                        <div className="space-y-1">
                          <ImageIcon className="w-6 h-6 text-slate-500 mx-auto" />
                          <p className="text-slate-400 text-[11px] font-sans">Select Slide Image</p>
                        </div>
                      )}
                    </div>

                    {/* Meta Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">Headline</label>
                        <input
                          type="text"
                          value={newSlideHeadline}
                          onChange={(e) => setNewSlideHeadline(e.target.value)}
                          placeholder="e.g. THE ORIGINAL BUTTER CHICKEN"
                          className="w-full bg-slate-850 border border-slate-750 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">Subline description</label>
                        <input
                          type="text"
                          value={newSlideSubline}
                          onChange={(e) => setNewSlideSubline(e.target.value)}
                          placeholder="e.g. Slow charcoal-simmered, velvety, and legendary."
                          className="w-full bg-slate-850 border border-slate-750 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddHeroSlide}
                    disabled={uploadingSlide || !newSlidePreview}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 font-semibold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 text-[11px]"
                  >
                    {uploadingSlide ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Upload Banner
                  </button>
                </div>
              </motion.div>
            )}

            {/* CENTENARY GALLERY */}
            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6 text-xs"
              >
                <h3 className="font-serif text-base text-white border-b border-slate-800 pb-3">
                  Restaurant Photo Gallery
                </h3>

                {/* Grid of photos */}
                {galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {galleryPhotos.map((photo) => (
                      <div key={photo.id} className="bg-slate-950 p-2 border border-slate-850 rounded relative group">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full aspect-square object-cover border border-slate-800 rounded"
                        />
                        {photo.caption && <p className="text-[10px] text-slate-400 mt-1 italic font-sans truncate">{photo.caption}</p>}
                        
                        <button
                          onClick={() => handleDeleteGalleryPhoto(photo.id)}
                          className="absolute top-4 right-4 p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Panel */}
                <div className="bg-slate-950/60 p-4 border border-slate-850 rounded space-y-4">
                  <h4 className="font-semibold text-white uppercase tracking-wider text-[10px]">Add Gallery Photo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Selector */}
                    <div
                      {...getGalleryRootProps()}
                      className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900 rounded p-6 text-center cursor-pointer flex flex-col justify-center"
                    >
                      <input {...getGalleryInputProps()} />
                      {galleryPreview ? (
                        <img src={galleryPreview} alt="Preview" className="w-full h-24 object-cover border border-slate-800" />
                      ) : (
                        <div className="space-y-1">
                          <ImageIcon className="w-6 h-6 text-slate-500 mx-auto" />
                          <p className="text-slate-400 text-[11px] font-sans">Select Gallery Image</p>
                        </div>
                      )}
                    </div>

                    {/* Caption */}
                    <div className="flex flex-col justify-center">
                      <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">Image Caption</label>
                      <input
                        type="text"
                        value={galleryCaption}
                        onChange={(e) => setGalleryCaption(e.target.value)}
                        placeholder="e.g. Fine dining seating arrangement"
                        className="w-full bg-slate-850 border border-slate-750 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500/50 text-[11px]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddGalleryPhoto}
                    disabled={uploadingGallery || !galleryPreview}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 font-semibold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 text-[11px]"
                  >
                    {uploadingGallery ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Upload Photo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
