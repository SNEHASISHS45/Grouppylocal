import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider, Button, IconButton, Tooltip } from '@mui/material';
import { FiZoomIn, FiRotateCw, FiSun, FiDroplet, FiImage } from 'react-icons/fi';
import { MdOutlineContrast, MdColorize, MdBlurOn, MdTune } from 'react-icons/md';

export default function PhotoEditor({ 
  imagePreview, 
  onSave, 
  onCancel,
  initialSettings = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sharpness: 0,
    temperature: 0,
    tint: 0,
    vignette: 0
  }
}) {
  // State for all editing features
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState('basic'); // basic, color, effects

  const updateSetting = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: <MdTune /> },
    { id: 'color', label: 'Color', icon: <MdColorize /> },
    { id: 'effects', label: 'Effects', icon: <MdBlurOn /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#242526] rounded-lg overflow-hidden"
    >
      <div className="relative">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full object-contain max-h-[400px]"
          style={{
            filter: `
              brightness(${settings.brightness}%)
              contrast(${settings.contrast}%)
              saturate(${settings.saturation}%)
              blur(${settings.blur}px)
              sepia(${settings.temperature}%)
              hue-rotate(${settings.tint}deg)
            `,
          }}
        />
      </div>

      <div className="p-4 bg-black/70">
        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                ${activeTab === tab.id 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Basic Adjustments */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm flex items-center">
                <FiSun className="mr-2" /> Brightness
              </label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.brightness}
                  min={0}
                  max={200}
                  onChange={(e, val) => updateSetting('brightness', val)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white text-sm flex items-center">
                <MdOutlineContrast className="mr-2" /> Contrast
              </label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.contrast}
                  min={0}
                  max={200}
                  onChange={(e, val) => updateSetting('contrast', val)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white text-sm flex items-center">
                <FiDroplet className="mr-2" /> Saturation
              </label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.saturation}
                  min={0}
                  max={200}
                  onChange={(e, val) => updateSetting('saturation', val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Color Adjustments */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm">Temperature</label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.temperature}
                  min={-100}
                  max={100}
                  onChange={(e, val) => updateSetting('temperature', val)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white text-sm">Tint</label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.tint}
                  min={-100}
                  max={100}
                  onChange={(e, val) => updateSetting('tint', val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Effects */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white text-sm">Blur</label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.blur}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={(e, val) => updateSetting('blur', val)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white text-sm">Sharpness</label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.sharpness}
                  min={0}
                  max={100}
                  onChange={(e, val) => updateSetting('sharpness', val)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white text-sm">Vignette</label>
              <div className="flex-1 mx-4">
                <Slider
                  value={settings.vignette}
                  min={0}
                  max={100}
                  onChange={(e, val) => updateSetting('vignette', val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outlined" 
            color="error"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onSave(settings)}
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}