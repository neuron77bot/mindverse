import { useState, useEffect } from 'react';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  originalText: string;
  inputMode: 'voice' | 'text';
  frames: StoryboardFrame[];
  comicPageUrl?: string;
  mermaidDiagram?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StoryboardsView() {
  // DUMMY COMPONENT FOR TESTING
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen">
      <div className="text-center p-8 bg-white/10 backdrop-blur rounded-3xl border-4 border-white/30">
        <h1 className="text-6xl font-bold text-white mb-4">📚</h1>
        <h2 className="text-4xl font-bold text-white mb-3">STORYBOARDS</h2>
        <p className="text-2xl text-white/80">Ruta funcionando correctamente</p>
        <div className="mt-6 text-lg text-yellow-300">
          ✅ Component rendering OK
        </div>
      </div>
    </div>
  );
}
