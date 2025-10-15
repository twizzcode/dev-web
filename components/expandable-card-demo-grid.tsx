"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { ShoppingCart, CreditCard, TrendingUp } from "lucide-react";
import Image from "next/image";

type CardType = 'header_google_form' | 'lanyard' | 'id_card' | 'organigram' | 'other';

export type CardItem = {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: React.ReactNode | (() => React.ReactNode);
  price?: number;
  sold?: number;
  type?: CardType;
  // Optional product id from DB for actions (cart / buy)
  productId?: string;
  // Backward compatibility (if earlier mapping injected _id)
  _id?: string;
  // Owned mode: if true, show Canva button and hide purchase actions
  owned?: boolean;
};

export interface ExpandableCardDemoProps {
  cards?: CardItem[];
}

export default function ExpandableCardDemo({ cards: cardsProp }: ExpandableCardDemoProps) {
  const cards = cardsProp ?? defaultCards;
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const id = useId();
  const ref = useRef<HTMLDivElement>(null!);

  const [adding,setAdding] = useState<string|null>(null);
  const [buying,setBuying] = useState<string|null>(null);
  const [opening,setOpening] = useState<string|null>(null);

  function resolveId(item: CardItem): string | undefined {
    return item.productId || (item as { _id?: string })._id || (item as { id?: string }).id;
  }

  const onAddToCart = async (item: CardItem) => {
    const id = resolveId(item);
    if (!id) {
      toast.error("Produk belum punya ID (mapping productId hilang)");
      return;
    }
    try {
      setAdding(id);
      const res = await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:id})});
      if(res.status === 401){
        window.location.href = '/login';
        return;
      }
      if(!res.ok){
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.error || msg; } catch {}
        toast.error(msg || 'Gagal menambah');
        return;
      }
      toast.success('Ditambahkan ke cart');
    } catch(e: unknown){
      const msg = e instanceof Error ? e.message : 'Gagal menambah';
      toast.error(msg);
    } finally { setAdding(null); }
  };

  const onBuyNow = async (item: CardItem) => {
    const id = resolveId(item);
    if (!id) {
      toast.error("Produk belum punya ID (mapping productId hilang)");
      return;
    }
    try {
      setBuying(id);
      // Pastikan sudah ada di cart (replace quantity 1)
      const addRes = await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:id, quantity:1, replace:true})});
      if(addRes.status === 401){ window.location.href='/login'; return; }
      if(!addRes.ok){
        let msg = await addRes.text();
        try { const j = JSON.parse(msg); msg = j.error || msg; } catch {}
        toast.error(msg || 'Gagal mempersiapkan'); return;
      }
      // Checkout hanya item ini
      const coRes = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{productId:id, quantity:1}]})});
      const data = await coRes.json().catch(()=>({}));
      if(!coRes.ok){
        toast.error(data?.error || 'Checkout gagal'); return;
      }
      if(data.redirectUrl){
        window.location.href = data.redirectUrl;
      } else {
        toast.success('Order dibuat');
      }
    } catch(e: unknown){
      const msg = e instanceof Error ? e.message : 'Checkout gagal';
      toast.error(msg);
    } finally { setBuying(null); }
  };

  const onOpenCanva = async (item: CardItem) => {
    const id = resolveId(item);
    if (!id) { toast.error('Produk tidak valid'); return; }
    try {
      setOpening(id);
      const res = await fetch(`/api/templates/${id}/owner-link`);
  if (res.status === 401) { window.location.href = '/login'; return; }
      if (res.status === 403) { toast.error('Akses ditolak. Produk belum dimiliki.'); return; }
      const data = await res.json().catch(()=>({}));
      const url = data?.ownerLink as string | undefined;
      if (!url) { toast.error('Link Canva belum tersedia untuk produk ini.'); return; }
      await navigator.clipboard.writeText(url);
      toast.success('Link disalin ke clipboard');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal membuka link';
      toast.error(msg);
    } finally { setOpening(null); }
  };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px]  h-full md:h-fit md:max-h-[90%]  flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div layoutId={`image-${active.title}-${id}`} className="w-full aspect-square sm:rounded-tr-lg sm:rounded-tl-lg overflow-hidden">
                <Image
                  src={active.src}
                  alt={active.title}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-medium text-neutral-700 dark:text-neutral-200 text-base"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed"
                    >
                      {active.description}
                    </motion.p>
                    {typeof (active as CardItem).price === 'number' && (
                      <div className="mt-2 text-neutral-800 dark:text-neutral-100 font-semibold">
                        Rp {(active as CardItem).price!.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  {typeof (active as CardItem).sold === 'number' && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-neutral-200/60 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[12px] text-neutral-600 dark:text-neutral-300 whitespace-nowrap"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Pembeli {(active as CardItem).sold!.toLocaleString('id-ID')}</span>
                    </motion.div>
                  )}
                </div>
                <div className="pt-2 relative px-4 pb-4">
                  {/* Content hidden in modal */}
                  <div className="flex gap-2">
                    {(active as CardItem).owned ? (
                      <button
                        onClick={() => onOpenCanva(active as CardItem)}
                        disabled={opening === resolveId(active as CardItem)}
                        className="flex-1 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                      >
                        {opening === resolveId(active as CardItem) ? 'Menyalin…' : 'Copy Link'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onAddToCart(active as CardItem)}
                          disabled={adding === resolveId(active as CardItem)}
                          className="flex-1 h-10 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {adding === resolveId(active as CardItem) ? 'Adding...' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => onBuyNow(active as CardItem)}
                          disabled={buying === resolveId(active as CardItem)}
                          className="flex-1 h-10 rounded-md bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          {buying === resolveId(active as CardItem) ? 'Processing...' : 'Buy Now'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="w-full grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start gap-3 sm:gap-4">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={card.title}
            onClick={() => setActive(card)}
            className="p-3 sm:p-4 flex flex-col hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer min-w-0 min-h-[360px]"
          >
            <div className="flex gap-4 flex-col  w-full">
              <motion.div layoutId={`image-${card.title}-${id}`} className="w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover object-center"
                />
              </motion.div>
              <div className="flex justify-start items-start flex-col w-full flex-1"
                style={{ minHeight: 180 }}
              >
                <div className="mt-0.5 w-full flex items-center justify-between gap-2 flex-wrap">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="font-medium text-neutral-800 dark:text-neutral-200 text-start md:text-left text-base truncate max-w-[75%]"
                    title={card.title}
                  >
                    {card.title}
                  </motion.h3>
                  {card.type && (
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-neutral-200/60 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300">
                      {typeLabel(card.type)}
                    </span>
                  )}
                </div>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="text-neutral-600 dark:text-neutral-400 text-start md:text-left text-sm leading-relaxed"
                >
                  {card.description}
                </motion.p>
                {(typeof (card as CardItem).price === 'number' || typeof (card as CardItem).sold === 'number') && (
                  <div className="mt-2 w-full flex items-center justify-between gap-2">
                    {typeof (card as CardItem).price === 'number' && (
                      <div className="text-neutral-800 dark:text-neutral-100 font-semibold whitespace-nowrap">
                        Rp {(card as CardItem).price!.toLocaleString('id-ID')}
                      </div>
                    )}
                    {typeof (card as CardItem).sold === 'number' && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200/60 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Pembeli {(card as CardItem).sold!.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-auto pt-2 flex gap-2 w-full">
                  {(card as CardItem).owned ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenCanva(card as CardItem); }}
                      disabled={opening === resolveId(card as CardItem)}
                      className="flex-1 h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {opening === resolveId(card as CardItem) ? 'Menyalin…' : 'Copy Link'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(card as CardItem); }}
                        disabled={adding === resolveId(card as CardItem)}
                        className="flex-1 h-9 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {adding === resolveId(card as CardItem) ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onBuyNow(card as CardItem); }}
                        disabled={buying === resolveId(card as CardItem)}
                        className="flex-1 h-9 rounded-md bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {buying === resolveId(card as CardItem) ? 'Processing...' : 'Buy Now'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </ul>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

function typeLabel(t: CardType) {
  switch (t) {
    case 'header_google_form':
      return 'Header Google Form';
    case 'lanyard':
      return 'Lanyard';
    case 'id_card':
      return 'ID Card';
    case 'organigram':
      return 'Organigram';
    default:
      return 'Other';
  }
}

const defaultCards: CardItem[] = [
  {
    description: "Lana Del Rey",
    title: "Summertime Sadness",
    src: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
    ctaText: "Visit",
    ctaLink: "https://ui.aceternity.com/templates",
    price: 49000,
    sold: 1240,
    type: 'header_google_form',
    content: () => {
      return (
        <p>
          Lana Del Rey, an iconic American singer-songwriter, is celebrated for
          her melancholic and cinematic music style. Born Elizabeth Woolridge
          Grant in New York City, she has captivated audiences worldwide with
          her haunting voice and introspective lyrics. <br /> <br /> Her songs
          often explore themes of tragic romance, glamour, and melancholia,
          drawing inspiration from both contemporary and vintage pop culture.
          With a career that has seen numerous critically acclaimed albums, Lana
          Del Rey has established herself as a unique and influential figure in
          the music industry, earning a dedicated fan base and numerous
          accolades.
        </p>
      );
    },
  },
  {
    description: "Babbu Maan",
    title: "Mitran Di Chhatri",
    src: "https://assets.aceternity.com/demos/babbu-maan.jpeg",
    ctaText: "Visit",
    ctaLink: "https://ui.aceternity.com/templates",
    price: 39000,
    sold: 870,
    type: 'id_card',
    content: () => {
      return (
        <p>
          Babu Maan, a legendary Punjabi singer, is renowned for his soulful
          voice and profound lyrics that resonate deeply with his audience. Born
          in the village of Khant Maanpur in Punjab, India, he has become a
          cultural icon in the Punjabi music industry. <br /> <br /> His songs
          often reflect the struggles and triumphs of everyday life, capturing
          the essence of Punjabi culture and traditions. With a career spanning
          over two decades, Babu Maan has released numerous hit albums and
          singles that have garnered him a massive fan following both in India
          and abroad.
        </p>
      );
    },
  },

  {
    description: "Metallica",
    title: "For Whom The Bell Tolls",
    src: "https://assets.aceternity.com/demos/metallica.jpeg",
    ctaText: "Visit",
    ctaLink: "https://ui.aceternity.com/templates",
    price: 59000,
    sold: 2234,
    type: 'organigram',
    content: () => {
      return (
        <p>
          Metallica, an iconic American heavy metal band, is renowned for their
          powerful sound and intense performances that resonate deeply with
          their audience. Formed in Los Angeles, California, they have become a
          cultural icon in the heavy metal music industry. <br /> <br /> Their
          songs often reflect themes of aggression, social issues, and personal
          struggles, capturing the essence of the heavy metal genre. With a
          career spanning over four decades, Metallica has released numerous hit
          albums and singles that have garnered them a massive fan following
          both in the United States and abroad.
        </p>
      );
    },
  },
  {
    description: "Lord Himesh",
    title: "Aap Ka Suroor",
    src: "https://assets.aceternity.com/demos/aap-ka-suroor.jpeg",
    ctaText: "Visit",
    ctaLink: "https://ui.aceternity.com/templates",
    price: 45000,
    sold: 156,
    type: 'lanyard',
    content: () => {
      return (
        <p>
          Himesh Reshammiya, a renowned Indian music composer, singer, and
          actor, is celebrated for his distinctive voice and innovative
          compositions. Born in Mumbai, India, he has become a prominent figure
          in the Bollywood music industry. <br /> <br /> His songs often feature
          a blend of contemporary and traditional Indian music, capturing the
          essence of modern Bollywood soundtracks. With a career spanning over
          two decades, Himesh Reshammiya has released numerous hit albums and
          singles that have garnered him a massive fan following both in India
          and abroad.
        </p>
      );
    },
  },
];
