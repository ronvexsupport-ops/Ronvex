import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Trash2,
  Info,
  ExternalLink,
  Save,
  Palette,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { HeaderConfig } from '../../types';
import { CMSService, DEFAULT_HEADER_CONFIG } from '../../services/cmsService';
import {
  PRESET_FAVICONS,
  PRESET_LOGOS,
  generateCustomMonogramSvg,
  updateDocumentFavicon,
} from '../../utils/brandingPresets';

interface LogoFaviconSettingsProps {
  headerConfig: HeaderConfig;
  onUpdateHeaderConfig: (updated: HeaderConfig) => void;
  adminEmail: string;
  adminUid: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const LogoFaviconSettings: React.FC<LogoFaviconSettingsProps> = ({
  headerConfig,
  onUpdateHeaderConfig,
  adminEmail,
  adminUid,
  onSuccess,
  onError,
}) => {
  const [saving, setSaving] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [activeSubTab, setActiveSubTab] = useState<'logo' | 'favicon' | 'generator'>('logo');

  // Generator state for custom monogram SVG
  const [genLetter, setGenLetter] = useState(headerConfig.brandName ? headerConfig.brandName.charAt(0) : 'R');
  const [genBgColor, setGenBgColor] = useState('#090d16');
  const [genTextColor, setGenTextColor] = useState('#ffffff');
  const [genAccentColor, setGenAccentColor] = useState('#10b981');

  // Helper for file upload conversion to base64 Data URL
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoUrl' | 'logoDarkUrl' | 'faviconUrl' | 'appleTouchIconUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onError('File size exceeds 2MB limit. Please choose a smaller icon or compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated: HeaderConfig = {
        ...headerConfig,
        [field]: result,
      };
      onUpdateHeaderConfig(updated);
      if (field === 'faviconUrl' || field === 'appleTouchIconUrl') {
        updateDocumentFavicon(
          field === 'faviconUrl' ? result : headerConfig.faviconUrl,
          field === 'appleTouchIconUrl' ? result : headerConfig.appleTouchIconUrl
        );
      }
      onSuccess(`Uploaded image applied to ${field === 'logoUrl' ? 'Logo' : field === 'faviconUrl' ? 'Favicon' : field}.`);
    };
    reader.onerror = () => {
      onError('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await CMSService.saveHeaderConfig(headerConfig, adminEmail, adminUid);
      updateDocumentFavicon(headerConfig.faviconUrl, headerConfig.appleTouchIconUrl);
      onSuccess('Site logo, favicon, and branding configurations saved successfully.');
    } catch (err: any) {
      onError(err.message || 'Failed to save branding configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset site logo and favicon to default RONVEX branding?')) {
      const resetConfig: HeaderConfig = {
        ...headerConfig,
        logoUrl: DEFAULT_HEADER_CONFIG.logoUrl,
        logoDarkUrl: DEFAULT_HEADER_CONFIG.logoDarkUrl,
        logoHeight: DEFAULT_HEADER_CONFIG.logoHeight,
        showWordmark: DEFAULT_HEADER_CONFIG.showWordmark,
        faviconUrl: DEFAULT_HEADER_CONFIG.faviconUrl,
        appleTouchIconUrl: DEFAULT_HEADER_CONFIG.appleTouchIconUrl,
        faviconPreset: DEFAULT_HEADER_CONFIG.faviconPreset,
      };
      onUpdateHeaderConfig(resetConfig);
      updateDocumentFavicon(resetConfig.faviconUrl, resetConfig.appleTouchIconUrl);
      onSuccess('Reset logo and favicon to default settings. Remember to click "Save Changes".');
    }
  };

  const applyFaviconPreset = (presetId: string, dataUri: string) => {
    const updated: HeaderConfig = {
      ...headerConfig,
      faviconUrl: dataUri,
      faviconPreset: presetId,
      appleTouchIconUrl: dataUri,
    };
    onUpdateHeaderConfig(updated);
    updateDocumentFavicon(dataUri, dataUri);
    onSuccess(`Applied "${presetId}" favicon preset.`);
  };

  const applyLogoPreset = (preset: typeof PRESET_LOGOS[0]) => {
    const updated: HeaderConfig = {
      ...headerConfig,
      logoUrl: preset.previewDataUri,
    };
    onUpdateHeaderConfig(updated);
    onSuccess(`Applied "${preset.name}" logo preset.`);
  };

  const applyGeneratedMonogram = () => {
    const svgUri = generateCustomMonogramSvg(genLetter, genBgColor, genTextColor, genAccentColor);
    const updated: HeaderConfig = {
      ...headerConfig,
      faviconUrl: svgUri,
      faviconPreset: 'custom_generated',
      appleTouchIconUrl: svgUri,
    };
    onUpdateHeaderConfig(updated);
    updateDocumentFavicon(svgUri, svgUri);
    onSuccess(`Custom monogram for "${genLetter}" generated and applied as favicon!`);
  };

  const currentFavicon = headerConfig.faviconUrl || DEFAULT_HEADER_CONFIG.faviconUrl;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">Logo & Favicon Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Configure your storefront logo, dark-mode variations, scaling, and browser tab favicon with live real-time previews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Branding Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('logo')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeSubTab === 'logo'
              ? 'bg-slate-850 text-emerald-400 border border-slate-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Site Logo & Sizing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('favicon')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeSubTab === 'favicon'
              ? 'bg-slate-850 text-emerald-400 border border-slate-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Favicon & App Icon</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('generator')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeSubTab === 'generator'
              ? 'bg-slate-850 text-emerald-400 border border-slate-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Custom Monogram Generator</span>
        </button>
      </div>

      {/* Main Grid: Settings (Left) + Interactive Live Previews (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: SITE LOGO SETTINGS */}
          {activeSubTab === 'logo' && (
            <div className="space-y-6">
              {/* Primary Logo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Primary Site Logo</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      The main logo image shown in the storefront header and navigation bar.
                    </p>
                  </div>
                  {headerConfig.logoUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateHeaderConfig({ ...headerConfig, logoUrl: '' })}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Logo Image URL (or upload local file below)
                  </label>
                  <input
                    type="text"
                    value={headerConfig.logoUrl || ''}
                    onChange={e => onUpdateHeaderConfig({ ...headerConfig, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or data:image/svg+xml..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Upload Logo from Computer</label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                      Click to choose or drop logo file
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PNG, SVG, JPG, WebP supported (transparent background recommended)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'logoUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Sizing & Dimension Controls */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        <span>Logo Display Height: <span className="text-emerald-400 font-mono font-bold">{headerConfig.logoHeight || 32}px</span></span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[24, 32, 40, 48].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onUpdateHeaderConfig({ ...headerConfig, logoHeight: h })}
                            className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                              (headerConfig.logoHeight || 32) === h
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {h}px
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="72"
                      step="2"
                      value={headerConfig.logoHeight || 32}
                      onChange={e => onUpdateHeaderConfig({ ...headerConfig, logoHeight: Number(e.target.value) })}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                  </div>

                  {/* Wordmark Toggle */}
                  <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                    <input
                      type="checkbox"
                      id="showWordmark"
                      checked={headerConfig.showWordmark !== false}
                      onChange={e => onUpdateHeaderConfig({ ...headerConfig, showWordmark: e.target.checked })}
                      className="mt-0.5 accent-emerald-500 rounded cursor-pointer"
                    />
                    <label htmlFor="showWordmark" className="text-xs text-slate-300 cursor-pointer select-none">
                      <span className="font-semibold text-white block">Show Brand Text Wordmark Next to Logo</span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        If unchecked, only the graphic logo mark will display in the header without the "{headerConfig.brandName || 'RONVEX'}" text.
                      </span>
                    </label>
                  </div>

                  {/* Alt Text for Accessibility */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Logo Alt Text (Accessibility & SEO)
                    </label>
                    <input
                      type="text"
                      value={headerConfig.logoAltText || ''}
                      onChange={e => onUpdateHeaderConfig({ ...headerConfig, logoAltText: e.target.value })}
                      placeholder="e.g. RONVEX Premium Electronics Bangladesh"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ready-to-Use Curated Luxury Logo Presets */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Curated Vector Logo Presets</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1-click vector logos formatted specifically for the RONVEX brand typography.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_LOGOS.map(preset => (
                    <div
                      key={preset.id}
                      className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="h-14 bg-slate-950 border border-slate-800/80 rounded-lg p-2 flex items-center justify-center overflow-hidden mb-2.5">
                          <img
                            src={preset.previewDataUri}
                            alt={preset.name}
                            className="max-h-10 max-w-full object-contain"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{preset.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyLogoPreset(preset)}
                        className="w-full py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Preset</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAVICON SETTINGS */}
          {activeSubTab === 'favicon' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Browser Favicon (.ico / .svg / .png)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    The small icon displayed in browser tabs, bookmarks, and mobile shortcut icons.
                  </p>
                </div>

                {/* Current Favicon Preview Badge */}
                <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-700 rounded-xl flex items-center justify-center p-2 shadow-inner shrink-0">
                    <img
                      src={currentFavicon}
                      alt="Favicon Preview"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block">Active Browser Favicon</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate block mt-0.5">
                      {headerConfig.faviconUrl ? (headerConfig.faviconUrl.startsWith('data:') ? 'Vector SVG Data URI' : headerConfig.faviconUrl) : 'System Default Monogram'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateDocumentFavicon(currentFavicon);
                      onSuccess('Refreshed browser tab favicon!');
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Test Tab</span>
                  </button>
                </div>

                {/* Favicon URL Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Favicon URL or Data URI
                  </label>
                  <input
                    type="text"
                    value={headerConfig.faviconUrl || ''}
                    onChange={e => {
                      const val = e.target.value;
                      onUpdateHeaderConfig({ ...headerConfig, faviconUrl: val });
                      updateDocumentFavicon(val);
                    }}
                    placeholder="https://example.com/favicon.png or data:image/svg+xml..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Upload Favicon */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Upload Favicon File</label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors" />
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                      Click to choose or drop favicon (.ico, .svg, .png)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Recommended: 64x64 or 32x32 square image with transparent padding
                    </span>
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.webp"
                      onChange={e => handleFileUpload(e, 'faviconUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Apple Touch Icon (Mobile Homescreen) */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white block">Apple Touch Icon (180x180)</label>
                      <span className="text-[11px] text-slate-400 block">
                        Used when iOS or Android users "Add to Home Screen" as a progressive web shortcut.
                      </span>
                    </div>
                    {headerConfig.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateHeaderConfig({
                            ...headerConfig,
                            appleTouchIconUrl: headerConfig.faviconUrl,
                          });
                          onSuccess('Synced Apple Touch Icon with Favicon.');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Copy from Favicon
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={headerConfig.appleTouchIconUrl || ''}
                    onChange={e => onUpdateHeaderConfig({ ...headerConfig, appleTouchIconUrl: e.target.value })}
                    placeholder="https://example.com/apple-touch-icon.png (Optional)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Ready-to-Use Preset Favicons */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Curated Luxury Favicon Presets</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Crisp, scalable vector SVGs hand-crafted for high visibility on both dark and light browser tabs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_FAVICONS.map(preset => {
                    const isSelected = headerConfig.faviconPreset === preset.id || headerConfig.faviconUrl === preset.previewDataUri;
                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-950 rounded-lg p-1.5 border border-slate-700/60 flex items-center justify-center shrink-0">
                            <img
                              src={preset.previewDataUri}
                              alt={preset.name}
                              className="w-7 h-7 object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{preset.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.description}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyFaviconPreset(preset.id, preset.previewDataUri)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM MONOGRAM SVG GENERATOR */}
          {activeSubTab === 'generator' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Monogram Generator</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate your own bespoke vector favicon badge in real-time with zero external files.
                </p>
              </div>

              {/* Generator Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Monogram Letter</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={genLetter}
                    onChange={e => setGenLetter(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-white text-center uppercase tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={genBgColor}
                      onChange={e => setGenBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={genBgColor}
                      onChange={e => setGenBgColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Letter Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={genTextColor}
                      onChange={e => setGenTextColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={genTextColor}
                      onChange={e => setGenTextColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Accent Outline & Dot</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={genAccentColor}
                      onChange={e => setGenAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={genAccentColor}
                      onChange={e => setGenAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Popular Brand Swatches</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Obsidian Emerald', bg: '#090d16', text: '#ffffff', accent: '#10b981' },
                    { label: 'Royal Onyx Gold', bg: '#000000', text: '#fef3c7', accent: '#f59e0b' },
                    { label: 'Deep Slate Cyan', bg: '#0f172a', text: '#ffffff', accent: '#06b6d4' },
                    { label: 'Rich Bordeaux', bg: '#1c0d12', text: '#ffffff', accent: '#fb7185' },
                  ].map(swatch => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => {
                        setGenBgColor(swatch.bg);
                        setGenTextColor(swatch.text);
                        setGenAccentColor(swatch.accent);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center gap-2 transition-colors"
                    >
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: swatch.accent }} />
                      <span>{swatch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Result Preview */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center p-2 shadow-md">
                    <img
                      src={generateCustomMonogramSvg(genLetter, genBgColor, genTextColor, genAccentColor)}
                      alt="Generated Preview"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Live Monogram Preview</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ready to apply to your browser tab immediately.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyGeneratedMonogram}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply as Favicon</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Simulator / Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* SIMULATOR 1: BROWSER TAB PREVIEW */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Browser Tab Preview</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">16x16 / 32x32</span>
            </div>

            <div className="p-4 bg-slate-900/50">
              {/* Chrome style browser frame mockup */}
              <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
                {/* Browser Titlebar */}
                <div className="bg-slate-850 px-3 pt-2.5 flex items-center gap-2 border-b border-slate-700/50">
                  <div className="flex items-center gap-1.5 pb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>

                  {/* Active Browser Tab */}
                  <div className="bg-slate-800 text-slate-100 px-3 py-1.5 rounded-t-lg flex items-center gap-2 text-xs font-medium max-w-[200px] border-t border-x border-slate-700/60 shadow-sm">
                    <img
                      src={currentFavicon}
                      alt="Favicon"
                      className="w-4 h-4 shrink-0 object-contain rounded-xs"
                    />
                    <span className="truncate text-[11px] font-sans">
                      {headerConfig.brandName || 'RONVEX'} | Premium
                    </span>
                    <span className="text-slate-400 hover:text-white text-[10px] ml-auto">✕</span>
                  </div>

                  <div className="text-slate-500 text-xs pb-2 pl-1">+</div>
                </div>

                {/* URL Bar */}
                <div className="bg-slate-800/90 px-3 py-1.5 flex items-center gap-2 border-b border-slate-700/60 text-[11px] text-slate-300 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">https://</span>
                  <span className="text-white font-semibold">ronvex.com</span>
                  <span className="text-slate-500">/shop</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATOR 2: DESKTOP HEADER PREVIEW */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Header Mockup</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors flex items-center gap-1 ${
                    previewTheme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors flex items-center gap-1 ${
                    previewTheme === 'dark' ? 'bg-slate-900 text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  previewTheme === 'light'
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                {/* Top notification notice if enabled */}
                {headerConfig.topNoticeEnabled && headerConfig.topNoticeText && (
                  <div
                    className={`text-[10px] py-1 px-3 text-center mb-3 rounded font-medium ${
                      previewTheme === 'light' ? 'bg-slate-900 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {headerConfig.topNoticeText}
                  </div>
                )}

                {/* Navbar Bar */}
                <div className="flex items-center justify-between gap-4">
                  {/* Brand & Logo */}
                  <div className="flex items-center gap-2.5">
                    {headerConfig.logoUrl ? (
                      <img
                        src={headerConfig.logoUrl}
                        alt={headerConfig.logoAltText || 'Logo Preview'}
                        style={{ height: `${headerConfig.logoHeight || 32}px`, maxHeight: '48px' }}
                        className="w-auto object-contain"
                      />
                    ) : null}
                    {(!headerConfig.logoUrl || headerConfig.showWordmark !== false) && (
                      <span className="text-base font-extrabold font-serif tracking-tight">
                        {headerConfig.brandName || 'RONVEX'}
                      </span>
                    )}
                  </div>

                  {/* Sample nav links */}
                  <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="hover:text-slate-950">Catalog</span>
                    <span className="hover:text-slate-950">Wearables</span>
                    <span className="hover:text-slate-950">Audio</span>
                  </div>

                  {/* Actions badge */}
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                      🔍
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                      🛍️
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATOR 3: MOBILE HOMESCREEN & APP ICON */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Mobile Homescreen Shortcut</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">180x180</span>
            </div>

            <div className="p-4 bg-slate-900/40">
              <div className="bg-gradient-to-b from-indigo-950/80 via-slate-900 to-black p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl shadow-xl border border-slate-700/80 p-2.5 flex items-center justify-center shrink-0">
                  <img
                    src={headerConfig.appleTouchIconUrl || currentFavicon}
                    alt="App Icon"
                    className="w-11 h-11 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{headerConfig.brandName || 'RONVEX'}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Homescreen progressive web bookmark & iOS touch icon
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">
                    Verified High DPI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
