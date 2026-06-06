"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

// Artistic pieces inspired by the provided visual grid — moody, cosmic, natural, abstract, structured
const artworks = [
  {
    id: 1,
    src: "https://picsum.photos/id/1015/1200/1600",
    title: "Whispers in the Canopy",
    category: "Nature",
    desc: "Ancient light moves through leaves that have seen centuries. Stillness that breathes.",
    tags: ["light", "time", "green"],
  },
  {
    id: 2,
    src: "https://picsum.photos/id/1005/1200/1600",
    title: "Heatmap (Beta)",
    category: "Data",
    desc: "Cities pulse like living organisms. Every point of light is a decision made in the dark.",
    tags: ["cosmic", "structure", "night"],
  },
  {
    id: 3,
    src: "https://picsum.photos/id/133/1200/1600",
    title: "Double Bottom",
    category: "Structure",
    desc: "Resistance. Breakdown. The quiet violence of markets drawn in light.",
    tags: ["chart", "tension", "line"],
  },
  {
    id: 4,
    src: "https://picsum.photos/id/160/1200/1600",
    title: "Pendulum Reverie",
    category: "Dream",
    desc: "Two hundred pendulums, each separated by 0.1 degrees. Order from chaos.",
    tags: ["physics", "rhythm", "light"],
  },
  {
    id: 5,
    src: "https://picsum.photos/id/201/1200/1600",
    title: "Ion Bloom",
    category: "Flora",
    desc: "Electric petals that only open under certain frequencies of longing.",
    tags: ["neon", "flower", "surreal"],
  },
  {
    id: 6,
    src: "https://picsum.photos/id/251/1200/1600",
    title: "The Upper Sky",
    category: "Cosmic",
    desc: "Aether. The pure upper air where forms dissolve into pure motion.",
    tags: ["stars", "vast", "indigo"],
  },
  {
    id: 7,
    src: "https://picsum.photos/id/29/1200/1600",
    title: "Rings of Recursion",
    category: "Abstract",
    desc: "Concentric ripples in sand and water. The universe repeating itself quietly.",
    tags: ["pattern", "minimal", "water"],
  },
  {
    id: 8,
    src: "https://picsum.photos/id/40/1200/1600",
    title: "Prism Memory",
    category: "Light",
    desc: "Color as architecture. Every band a different temperature of memory.",
    tags: ["spectrum", "color", "wall"],
  },
  {
    id: 9,
    src: "https://picsum.photos/id/1033/1200/1600",
    title: "Lupine Ascent",
    category: "Flora",
    desc: "Mountains wearing fields of purple like a slow, deliberate crown.",
    tags: ["mountain", "wild", "dawn"],
  },
  {
    id: 10,
    src: "https://picsum.photos/id/106/1200/1600",
    title: "Glass Veins",
    category: "Abstract",
    desc: "Light trapped inside form. The moment before the shatter.",
    tags: ["glass", "refraction", "blue"],
  },
  {
    id: 11,
    src: "https://picsum.photos/id/180/1200/1600",
    title: "Nocturne Drift",
    category: "Cosmic",
    desc: "A boat, a horizon, a sky that has forgotten how to be day.",
    tags: ["sea", "dusk", "solitude"],
  },
  {
    id: 12,
    src: "https://picsum.photos/id/1016/1200/1600",
    title: "Folding the Horizon",
    category: "Structure",
    desc: "Hands meeting under constellations. Two futures deciding to hold.",
    tags: ["hands", "stars", "promise"],
  },
  {
    id: 13,
    src: "https://picsum.photos/id/30/1200/1600",
    title: "After the Fire",
    category: "Nature",
    desc: "Charred elegance. New green already pushing through the black.",
    tags: ["burn", "regrowth", "gold"],
  },
  {
    id: 14,
    src: "https://picsum.photos/id/251/1400/1600",
    title: "Signal from the Deep",
    category: "Dream",
    desc: "Something ancient learned to glow. It is trying to tell us its name.",
    tags: ["biolum", "mystery", "violet"],
  },
];

const categories = ["All", "Nature", "Cosmic", "Abstract", "Flora", "Light", "Structure", "Data", "Dream"];

type Artwork = (typeof artworks)[number];

export default function Aether() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [progress, setProgress] = useState(0);

  // Filter logic
  const filtered = artworks
    .filter((art) => {
      const matchesCategory = activeCategory === "All" || art.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        art.title.toLowerCase().includes(q) ||
        art.desc.toLowerCase().includes(q) ||
        art.tags.some((t) => t.includes(q));
      return matchesCategory && matchesSearch;
    });

  // Scroll progress bar (cool subtle motion detail)
  React.useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard close for modal
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openArt = (art: Artwork) => {
    setSelected(art);
    document.body.style.overflow = "hidden";
  };

  const closeArt = () => {
    setSelected(null);
    document.body.style.overflow = "visible";
  };

  const handleSave = (art: Artwork) => {
    toast.success(`Saved “${art.title}” to your collection`, {
      description: "It will move with you.",
    });
  };

  const handleShare = (art: Artwork) => {
    navigator.clipboard.writeText(`${art.title} — ${art.desc}`);
    toast("Mood copied", {
      description: "The feeling has been shared.",
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Scroll progress — tiny elegant line */}
      <div
        className="progress-bar"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Minimal elegant nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="font-semibold tracking-[-1.5px] text-2xl">AETHER</div>
            <div className="text-[10px] font-mono text-white/40 tracking-[3px] mt-1">EST 2026</div>
          </div>

          <div className="flex items-center gap-8 text-sm font-medium">
            <a href="#discover" className="hover:text-white/70 transition-colors">Discover</a>
            <a href="#motion-lab" className="hover:text-white/70 transition-colors">The Motion</a>
            <a href="#journal" className="hover:text-white/70 transition-colors">Journal</a>
            <button
              onClick={() => {
                const el = document.getElementById("discover");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all active:scale-[0.985]"
            >
              Enter the grid <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — big, cinematic, moving text */}
      <section className="min-h-[100dvh] flex items-center justify-center pt-16 relative">
        <div className="max-w-5xl px-6 text-center">
          <div className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-xs tracking-[2px] text-white/50 font-mono">
            A CURATED VISUAL RITUAL
          </div>

          <h1 className="text-[92px] md:text-[120px] leading-[0.82] font-semibold tracking-[-6.5px] mb-6 poetic">
            Art that<br />refuses to<br />stay still.
          </h1>

          <p className="max-w-md mx-auto text-xl text-white/60 mb-10">
            A living collection of motion. Every image is a moment that continues breathing.
          </p>

          <button
            onClick={() => document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" })}
            className="group inline-flex items-center gap-3 px-8 h-14 rounded-full bg-white text-black text-sm font-medium tracking-wide hover:bg-white/90 active:scale-[0.985] transition-all"
          >
            BEGIN THE MOVEMENT
            <ArrowRight className="group-hover:translate-x-0.5 transition" size={18} />
          </button>
        </div>

        {/* Subtle floating indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[3px] text-white/40 font-mono flex flex-col items-center gap-1">
          SCROLL TO MOVE
          <div className="h-px w-6 bg-white/30" />
        </div>
      </section>

      {/* Discover — The Grid */}
      <section id="discover" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="text-xs font-mono tracking-[3px] text-white/50 mb-1">THE COLLECTION</div>
            <div className="text-6xl font-semibold tracking-[-2.5px]">Discover</div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search light, form, memory..."
            className="bg-transparent border border-white/10 focus:border-white/40 placeholder:text-white/30 text-sm px-5 h-11 w-full md:w-80 rounded-full outline-none"
          />
        </div>

        {/* Filters — motion pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`filter-pill px-5 h-9 rounded-full text-sm font-medium ${activeCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* The Artistic Moving Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--grid-gap)]">
          <AnimatePresence>
            {filtered.map((art, index) => (
              <motion.div
                key={art.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ 
                  duration: 0.5, 
                  delay: Math.min(index * 0.015, 0.2),
                  ease: [0.23, 1.0, 0.32, 1] 
                }}
                onClick={() => openArt(art)}
                className="art-card group rounded-2xl overflow-hidden aspect-[4/3.1] relative flex flex-col"
              >
                <div className="relative flex-1 overflow-hidden bg-black">
                  <img
                    src={art.src}
                    alt={art.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-5 flex items-center justify-between bg-[#0a0a0a] border-t border-white/10">
                  <div>
                    <div className="font-medium tracking-tight text-[15px]">{art.title}</div>
                    <div className="text-xs text-white/50 font-mono tracking-widest mt-0.5">{art.category.toUpperCase()}</div>
                  </div>
                  <div className="text-white/40 group-hover:text-white/70 transition">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/40">No pieces match your search.</div>
        )}
      </section>

      {/* Motion Lab — the "moving cool" interactive section */}
      <section id="motion-lab" className="border-t border-white/10 bg-[#0a0a0a] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="text-xs tracking-[4px] font-mono text-white/50 mb-2">EXPERIMENT</div>
            <div className="text-6xl font-semibold tracking-[-2px]">The Motion Lab</div>
            <p className="mt-3 max-w-sm text-white/60">Move your cursor over the pieces. They respond in real time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[artworks[5], artworks[9], artworks[3]].map((art, idx) => (
              <TiltCard key={idx} art={art} onOpen={() => openArt(art)} />
            ))}
          </div>
        </div>
      </section>

      {/* Journal / Philosophy */}
      <section id="journal" className="max-w-3xl mx-auto px-6 py-24 text-center border-t border-white/10">
        <div className="text-xs font-mono tracking-[3px] text-white/50 mb-3">THE PHILOSOPHY</div>
        <div className="text-5xl leading-none tracking-[-1.5px] font-semibold mb-8">
          Still images are a lie.<br />Everything is already moving.
        </div>
        <p className="text-white/60 max-w-md mx-auto">
          Aether is not a gallery. It is a slow argument that beauty is never static — only momentarily held.
        </p>
      </section>

      <footer className="border-t border-white/10 py-9 text-center text-xs text-white/40 font-mono tracking-widest">
        AETHER — GROKBUILDTEST • MOTION IS THE ONLY CONSTANT
      </footer>

      {/* The Beautiful Moving Modal */}
      <AnimatePresence>
        {selected && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
            onClick={closeArt}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay absolute inset-0"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", bounce: 0.02, duration: 0.4 }}
              className="modal-content relative w-full max-w-[1100px] rounded-3xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image side — big and moving */}
              <div className="relative md:w-3/5 bg-black aspect-[4/3] md:aspect-auto overflow-hidden">
                <motion.img
                  src={selected.src}
                  alt={selected.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* very subtle slow breathing motion on the art */}
                <motion.div 
                  className="absolute inset-0 bg-[radial-gradient(#fff_0.5px,transparent_1px)] bg-[length:4px_4px] opacity-[0.035]"
                  animate={{ backgroundPosition: ["0px 0px", "4px 4px"] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Text + actions side */}
              <div className="md:w-2/5 p-8 md:p-10 flex flex-col">
                <button 
                  onClick={closeArt} 
                  className="self-end -mr-2 -mt-2 mb-4 text-white/50 hover:text-white p-2"
                >
                  <X size={20} />
                </button>

                <div className="font-mono text-xs tracking-[3px] text-white/50 mb-1">{selected.category.toUpperCase()}</div>
                <div className="text-4xl leading-none tracking-[-1.5px] font-semibold mb-6 pr-4">
                  {selected.title}
                </div>

                <div className="text-lg text-white/80 leading-snug mb-8 pr-2 poetic">
                  {selected.desc}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {selected.tags.map((tag) => (
                    <div key={tag} className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/60 border border-white/10">
                      {tag}
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => handleSave(selected)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-white/15 hover:bg-white/5 active:bg-white/10 transition"
                  >
                    <Heart size={16} /> SAVE TO MOTION
                  </button>
                  <button
                    onClick={() => handleShare(selected)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-white/15 hover:bg-white/5 active:bg-white/10 transition"
                  >
                    <Share2 size={16} /> SHARE THE FEELING
                  </button>
                </div>

                <div className="text-[10px] text-center text-white/30 mt-6 font-mono tracking-widest">
                  DRAG OR PRESS ESC TO LEAVE
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Cool interactive tilt card for the Motion Lab
function TiltCard({ art, onOpen }: { art: Artwork; onOpen: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.PointerEvent) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    setRotate({
      x: -y * 11, // tilt
      y: x * 14,
    });
  };

  const reset = () => setRotate({ x: 0, y: 0 });

  return (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onClick={onOpen}
      className="tilt-card group relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 bg-black cursor-pointer select-none"
      style={{
        transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      <img
        src={art.src}
        alt={art.title}
        className="absolute inset-0 w-full h-full object-cover scale-[1.02] group-hover:scale-100 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="font-medium text-xl tracking-tight">{art.title}</div>
        <div className="text-xs text-white/60 font-mono tracking-widest mt-1">{art.category}</div>
      </div>

      <div className="absolute top-4 right-4 px-3 py-1 text-[10px] rounded-full bg-black/60 text-white/70 border border-white/10 font-mono tracking-widest">
        MOVE ME
      </div>
    </div>
  );
}
