"use client";
import React, { useState } from 'react';
import { useTheme } from 'next-themes';

interface TemplateLinkGroup {
  id: string;
  label: string;
  mode: 'with-gap' | 'without-gap' | 'carousel' | 'coming-soon';
  links?: string[]; // only for active templates
  description: string;
  preview?: string; // optional future image preview
  comingSoon?: boolean;
}

const BASIC_TEMPLATES: TemplateLinkGroup[] = [
  {
    id: 'with-gap',
    label: 'Grid With Gap',
    mode: 'with-gap',
    description: 'Grid 3 x N dengan jarak antar slice (width komposit 3130px).',
    links: [
      'https://s.id/ruOjY',
      'https://s.id/LLhHl',
      'https://s.id/5Xo54',
      'https://s.id/D7YnA',
      'https://s.id/QhLfS'
    ]
  },
  {
    id: 'without-gap',
    label: 'Grid Without Gap',
    mode: 'without-gap',
    description: 'Grid 3 x N rapat tanpa jarak (width komposit 3110px).',
    links: [
      'https://s.id/without-gap-3x1',
      'https://s.id/without-gap-3x2',
      'https://s.id/without-gap-3x3',
      'https://s.id/without-gap-3x4',
      'https://s.id/without-gap-3x5'
    ]
  },
  {
    id: 'carousel',
    label: 'Carousel',
    mode: 'carousel',
    description: 'Template carousel multi-slide untuk konten storytelling.',
    links: [
      'https://s.id/DeH5H'
    ]
  }
];

const COMING_SOON: TemplateLinkGroup[] = [
  { id:'lanyard', label:'Lanyard', mode:'coming-soon', description:'Template lanyard event / badge digital.', comingSoon:true },
  { id:'co-card', label:'Co Card', mode:'coming-soon', description:'Kartu kolaborasi / identitas brand.', comingSoon:true },
  { id:'profile-pack', label:'Profile Pack', mode:'coming-soon', description:'Bundle aset profil multi-platform.', comingSoon:true },
];

const CATEGORY_TABS = [
  { id:'basic', label:'Basic Templates', groups: BASIC_TEMPLATES },
  { id:'upcoming', label:'Coming Soon', groups: COMING_SOON },
];

const TemplatesPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('basic');
  const groups = CATEGORY_TABS.find(t=>t.id===activeTab)?.groups || [];

  return (
    <div className="relative flex flex-1 min-h-[calc(100vh-80px)] w-full overflow-hidden">
      {/* Grid / gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(120,119,198,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)`, backgroundSize: '48px 48px' }} />
      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-5 py-8 lg:px-10 gap-6">
        <header className="flex flex-col gap-3 items-start">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium bg-background/60 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Template Library</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
            Pilih & gunakan template siap pakai
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Koleksi template dasar untuk grid dan carousel. Fitur lanjutan seperti lanyard & identitas brand akan segera hadir. Klik link untuk melihat contoh ukuran dan struktur slice yang benar.
          </p>
        </header>
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_TABS.map(tab => {
            const active = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`relative h-9 px-4 rounded-full text-xs font-medium transition border ${active? 'bg-primary text-primary-foreground border-primary shadow-sm':'hover:bg-muted/60 border-border'}`}>
                {tab.label}
                {tab.id==='upcoming' && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/30">Soon</span>}
              </button>
            );
          })}
        </div>
        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 pb-10">
          {groups.map(g => (
            <TemplateCard key={g.id} group={g} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ group: TemplateLinkGroup; theme?: string }> = ({ group }) => {
  const [selected, setSelected] = useState(1);
  const [copied, setCopied] = useState(false);
  const isCarousel = group.mode === 'carousel';
  const selectable = group.links && group.links.length > 1 && !isCarousel;
  const handleCopy = async () => {
    if(!group.links || !group.links.length) return; await navigator.clipboard.writeText(group.links[selected - 1]); setCopied(true); setTimeout(()=>setCopied(false), 1100);
  };
  return (
    <div className={`relative group rounded-xl border bg-gradient-to-b from-background/70 to-background/40 backdrop-blur-sm p-4 flex flex-col gap-4 overflow-hidden ${group.comingSoon? 'opacity-70':''}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_60%)' }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2">
            {group.label}
            {group.comingSoon && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/30">Coming Soon</span>}
          </h3>
          <p className="text-[11px] mt-1 text-muted-foreground leading-relaxed line-clamp-3">
            {group.description}
          </p>
        </div>
      </div>
      {group.links && !group.comingSoon && (
        <div className="flex flex-col gap-3 mt-auto">
          {selectable && (
            <select value={selected} onChange={e=>setSelected(Number(e.target.value))} className="h-9 text-[11px] rounded-full border bg-background/70 px-3 pr-6">
              {group.links.map((_,i)=> (
                <option key={i} value={i+1}>3 x {i+1} = {group.mode==='with-gap'? '3130px':'3110px'} x {(i+1)*1350}px</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2">
            <button onClick={()=> window.open(group.links![selected - 1],'_blank')} className="flex-1 h-9 rounded-full text-[11px] font-medium bg-muted/50 hover:bg-muted transition text-left px-4 truncate">
              {group.links![selected - 1]}
            </button>
            <button onClick={handleCopy} className={`h-9 px-4 rounded-full text-[11px] font-semibold transition ${copied? 'bg-emerald-500 text-emerald-950':'bg-primary text-primary-foreground hover:opacity-90'}`}>{copied? 'Copied':'Copy'}</button>
          </div>
        </div>
      )}
      {group.comingSoon && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
          Sedang disiapkan
        </div>
      )}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tr from-violet-600/10 via-fuchsia-500/10 to-pink-500/10 blur-2xl" />
    </div>
  );
};

export default TemplatesPage;