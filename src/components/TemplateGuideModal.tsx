import { X, CheckCircle2, ShieldCheck, Zap, Globe, Code, ExternalLink } from 'lucide-react';

interface TemplateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateGuideModal({ isOpen, onClose }: TemplateGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                OpenStreetMap Full-Screen Template
              </h3>
              <p className="text-xs text-slate-500">
                100% Free · No API Keys · Zero Recurring Costs
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

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs md:text-sm text-slate-700 dark:text-slate-300">
          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300 text-xs mb-1">
                <ShieldCheck className="w-4 h-4" /> No Credit Card
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Uses public OpenStreetMap tiles and Carto free basemaps. Never requires an API token.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 text-xs mb-1">
                <Zap className="w-4 h-4" /> Live Geolocation
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Hardware GPS radar pulse, accuracy ring, reverse geocoding, and smooth auto-follow.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 text-xs mb-1">
                <Code className="w-4 h-4" /> Ready to Extend
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Built with Leaflet, React 19, and Tailwind CSS. Clean component structure.
              </p>
            </div>
          </div>

          {/* Features Included */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              Features Built Into This Template
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Full-screen responsiveness:</strong> Adapts seamlessly to all desktop, tablet, and mobile viewports.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instant Geocoding Search:</strong> Search any landmark or address using the free OpenStreetMap Nominatim API.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>5 Map Styles:</strong> Switch between Standard OSM, Light Positron, Dark Matter, Voyager, and Topographic.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Interactive Pins & GeoJSON:</strong> Click anywhere on the map to drop pins, calculate distances, and export GeoJSON.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Measurement Tool:</strong> Click multiple points to calculate real-world path distances in meters and kilometers.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Demo Fallback Mode:</strong> If user denies GPS permissions or tests on desktop without sensors, test with 6 preset global cities.</span>
              </div>
            </div>
          </div>

          {/* How to customize code */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs">
              Developer Customization Quick Reference
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              • <strong>Tile URLs:</strong> Customize <code className="text-blue-600 font-mono text-[11px]">src/utils/tileLayers.ts</code> to add your own custom tile servers (e.g. self-hosted TileServer GL, Stamen, or MapTiler).
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              • <strong>Routing & Directions:</strong> You can integrate the free Open Source Routing Machine (<code className="text-blue-600 font-mono text-[11px]">router.project-osrm.org</code>) for turn-by-turn navigation without any API fees.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              • <strong>Attribution:</strong> OpenStreetMap data is licensed under the ODbL license. Keep the subtle attribution line in place as provided.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <a
            href="https://www.openstreetmap.org/about"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
          >
            Learn about OpenStreetMap <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
