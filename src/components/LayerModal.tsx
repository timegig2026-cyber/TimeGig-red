import React from 'react';
import { X, Check, Map } from 'lucide-react';
import { TileLayerConfig } from '../types/map';
import { TILE_LAYERS } from '../utils/tileLayers';

interface LayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: TileLayerConfig;
  onSelectLayer: (layer: TileLayerConfig) => void;
}

export default function LayerModal({
  isOpen,
  onClose,
  activeLayer,
  onSelectLayer,
}: LayerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-all">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Map className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Map Layer Styles
              </h3>
              <p className="text-xs text-slate-500">
                100% Free OpenStreetMap tile providers — no API fees
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Choices */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {TILE_LAYERS.map((layer) => {
            const isSelected = layer.id === activeLayer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => {
                  onSelectLayer(layer);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {layer.name}
                    </span>
                    {layer.id === 'osm-standard' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        Default OSM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {layer.description}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
                    Max Zoom: {layer.maxZoom}
                  </p>
                </div>
                <div className="mt-1">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Source: OpenStreetMap Community</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
