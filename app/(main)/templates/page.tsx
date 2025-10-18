"use client";
import React, { useMemo, useState } from 'react';
import ExpandableCardDemo, { CardItem as ExpandableCardItem } from '@/components/expandable-card-demo-grid';

type TemplateCategory = 'header_google_form' | 'lanyard' | 'id_card' | 'organigram' | 'other' | string; // align with CardType plus dynamic slugs

interface TemplateLinkGroup {
  id: string;
  label: string;
  mode: 'with-gap' | 'without-gap' | 'carousel' | 'coming-soon';
  links?: string[]; // only for active templates
  description: string;
  preview?: string; // optional future image preview
  comingSoon?: boolean;
  category?: TemplateCategory;
}

type ActiveFilter = 'basic' | 'owned' | 'all' | TemplateCategory;

const PRIMARY_CHIPS: { id: 'basic' | 'owned'; label: string }[] = [
  { id: 'basic', label: 'Basic Templates' },
  { id: 'owned', label: 'Owned' },
];

type CategoryChip = { id: string; label: string };

const TemplatesPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [categoryChips, setCategoryChips] = useState<CategoryChip[]>([{ id: 'all', label: 'All' }]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [items, setItems] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Load categories dynamically from DB
  React.useEffect(() => {
    let cancelled = false;
    setCatsLoading(true);
    fetch('/api/templates/categories')
      .then(r => r.json())
      .then((rows: { slug: string; name: string }[]) => {
        if (cancelled) return;
        const chips: CategoryChip[] = [{ id: 'all', label: 'All' }, ...rows.map(r => ({ id: r.slug, label: r.name }))];
        setCategoryChips(chips);
      })
      .catch(() => {
        if (!cancelled) setCategoryChips([{ id: 'all', label: 'All' }]);
      })
      .finally(() => { if (!cancelled) setCatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isOwned = activeFilter === 'owned';
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = isOwned ? '/api/templates?filter=owned' : `/api/templates?filter=${encodeURIComponent(activeFilter)}`;
    fetch(url)
      .then(r => r.json())
      .then((data: ProductDTO[]) => { if (!cancelled) setItems(data); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeFilter, isOwned]);

  const filtered = useMemo(() => items, [items]);

  return (
    <div className="relative flex flex-1 min-h-[calc(100vh-80px)] w-full overflow-y-auto overflow-x-hidden">
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
        {/* Combined chips: Basic/Owned + Categories (single active) */}
        <div className="-mb-2 overflow-visible">
          <div className="flex flex-wrap gap-2 py-2 items-center w-full">
            {/* Neutral chips for categories */}
            {categoryChips.map(chip => {
              const active = chip.id === activeFilter;
              return (
                <button
                  key={chip.id}
                  onClick={()=>setActiveFilter(chip.id as ActiveFilter)}
                  className={`h-8 px-3 rounded-full text-[11px] font-medium transition border whitespace-nowrap ${active? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-200':'hover:bg-muted/60 border-border text-muted-foreground'}`}
                >
                  {chip.label}{catsLoading && chip.id==='all' ? '…' : ''}
                </button>
              );
            })}

            {/* Divider */}
            <span className="mx-1 h-5 w-px bg-border" />

            {/* Primary chips for Basic/Owned (at end) */}
            {PRIMARY_CHIPS.map(tab => {
              const active = tab.id === activeFilter;
              return (
                <button
                  key={tab.id}
                  onClick={()=>setActiveFilter(tab.id)}
                  className={`h-9 px-4 rounded-full text-[11px] font-semibold transition whitespace-nowrap ${active
                    ? 'bg-primary text-primary-foreground border border-primary shadow-sm ring-2 ring-primary/40'
                    : 'border border-violet-500/40 dark:border-violet-400/40 text-violet-700 dark:text-violet-200 bg-violet-600/15 dark:bg-violet-400/10 hover:bg-violet-600/25 dark:hover:bg-violet-400/20'}
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards grid (Expandable) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl border animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <ExpandableCardDemo cards={mapProductsToCards(filtered, isOwned)} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground border rounded-xl">
            {isOwned ? (
              <>
                <p className="font-medium text-foreground mb-1">Belum ada template yang dimiliki</p>
                <p>Template yang sudah dibeli akan muncul di sini.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground mb-1">Belum ada template untuk kategori ini</p>
                <p>Coba pilih kategori lain atau tampilkan All.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

type ProductDTO = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  soldCount: number;
  category: { slug: string; name: string } | null;
  links: { url: string; label?: string | null }[];
  owned?: boolean;
  buyersCount?: number;
};

// Local union matching the card component's accepted types
type LocalCardType = 'header_google_form' | 'lanyard' | 'id_card' | 'organigram' | 'other';
const allowedTypes = new Set<LocalCardType>(['header_google_form','lanyard','id_card','organigram','other']);
function toCardType(slug?: string | null): LocalCardType {
  if (!slug) return 'other';
  return (allowedTypes.has(slug as LocalCardType) ? (slug as LocalCardType) : 'other');
}

function mapProductsToCards(rows: ProductDTO[], ownedFlag: boolean): ExpandableCardItem[] {
  return rows.map((p) => ({
    title: p.title,
    description: p.description,
    src: p.imageUrl,
    ctaText: 'Lihat',
    ctaLink: p.links?.[0]?.url || '#',
    content: null,
    price: p.price,
  sold: typeof p.buyersCount === 'number' ? p.buyersCount : p.soldCount,
    type: toCardType(p.category?.slug),
    productId: p.id,
    owned: typeof p.owned === 'boolean' ? p.owned : ownedFlag,
  }));
}

export default TemplatesPage;