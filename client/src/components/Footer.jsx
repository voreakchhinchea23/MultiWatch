import React from 'react';
import { Radio, Heart, Shield, Sparkles, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#060a14] mt-16 text-white/60 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Col 1: Brand & Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center">
                <Radio className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight font-display">
                MultiWatch LIVE
              </span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed max-w-sm mb-4">
              Watch multiple YouTube live streams at the same time with synchronized real-time live comments and flexible multi-grid layouts.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All stream embeds powered by official YouTube Iframe Player</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Live Streaming Hub</h4>
            <ul className="space-y-2 text-white/50">
              <li>
                <span className="text-white/70">Multi-Stream Synchronizer</span>
              </li>
              <li>
                <span className="text-white/70">Real-Time Chat Integration</span>
              </li>
              <li>
                <a 
                  href="https://loffystore.com/live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Concept Reference: Loffy Store</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Features & Support */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Key Features</h4>
            <div className="space-y-2 text-white/50">
              <p>• Auto-detection of YouTube live broadcasts</p>
              <p>• Multi-stream 1x1, 2x1, 2x2 and Dynamic Grid layouts</p>
              <p>• Embedded real-time YouTube live comment panel</p>
              <p>• Add & save unlimited custom YouTube handles</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-[11px]">
          <div>
            © {new Date().getFullYear()} MultiWatch. Built for YouTube live streamer communities.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Crafted with <Heart className="h-3 w-3 text-red-500 fill-current inline" /> in ReactJS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
