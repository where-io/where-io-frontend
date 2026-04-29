import { useEffect, useState } from "react";
import {LocaisService} from "../../service/LocaisService";

// Tailwind config is injected via CDN in the HTML shell that renders this component.
// All class names match the custom theme defined in the original HTML.

const FILTERS = ["All", "Nebulae", "Stations", "Outposts"];

const PLACES = [
    {
        id: 1,
        name: "Orion's Belt Outpost",
        subtitle: "Sector 7G • Alpha Quadrant",
        pinned: true,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWtOUQOxxUd4xOLjLlsREUr99li3QoE1EugcVVvLh1CLT5PxrMPf8Te_m3NGMWERCtmkLhEmwgqy7k1QewI6oD5FW33JQCDEAFqMHvsC8zmbm5NobK50LYoP_-8RzohOu08lGfJYHcbdUFOG8umq_9N5SSCqmhjRquIYyEz7tR96HztWkchtxt4hnSq4vUCfORqx0o8qhMG5XqqTrmCxTe3u3mNCQIoQQOQOvrsF2Pp8V-mEczDBX7G3hQQhJdf-XlI59YLc31GpU",
        alt: "vibrant pink and orange glowing nebula in deep space with surrounding pin-point stars",
    },
    {
        id: 2,
        name: "Mare Tranquillitatis",
        subtitle: "Lunar Hub • Base IV",
        pinned: false,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbnXppjgIK2By82gUkQxgAJ1GWjbxVg87La0DrN5kv-nfgXP6GEHdfEZBWnJwl9Ft5eXo44WnXC4-cSK-Z9tLtMolwYIUnAdwyytzGdsKT37BCZWS6CXLYfCX5gE4uJG0rhLPYfoz5v0V0-aF-Ya4BLokLYeMbWBFQxgLgAK_VW-URPZ8xV-GX1dEgKLa2kGDXUo1D-U0sDXy2ZUO6Lteq3iIOMjm1DgD8lMcBVPV8O7E0daanhrXXXPtNZZIZ_OTqjLq9FF5OL_0",
        alt: "high contrast aerial view of a dark lunar landscape with deep craters and sharp shadows",
    },
    {
        id: 3,
        name: "Neptune Echo Station",
        subtitle: "Outer Rim • Deep Space 9",
        pinned: false,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM2Om941FKTeVdWrGPbLZS0ehwf-kLoHimlp_GFBGfRjjVXepzBFVbUNmsLtr2zzFyUH3alLTz-KcClveIxo_4Y2UxgYnEKBcaDE2DI3Uj31kPsgbt8PdYVkaO6giRKamHBMHm86iel1yGU4ZYRgPyXvvDOymbMJLw6a6bTnp2jWQ3AvJmZjMKtXCnABu1fSfTuD2ObR11FT1yhabPwmNBSut2_gMDRkW7_AgJvdRDfqM5RyH55IthAMsKYCd8-3jK_EUtsz-s6Rw",
        alt: "dramatic blue swirling gas giant planet with faint rings in a dark cosmic void",
    },
    {
        id: 4,
        name: "ISS Terminal C",
        subtitle: "Low Earth Orbit • 408km",
        pinned: false,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOCrU50tpl0TuofXBy3bxV9Lyjs7YX0FpwoQrXaD8qh5-fCkSq6ahn_XWqtwAkXl9rcs4wKiE_ah6eD4Zu4neZB0vQGJnnlfLarQ1d-4ci5vj9zg7x5LdAKOI7h2caVA2-MmqU7JR_DNHLuup1kZFmKgPx6UFEHIIBy4lBv7ExKe5ykXSUmt2PFDb1IoPs7SxGBtaaqH9kV42cKKGo_NsORZsdT2zCuIMokN2p-waj-E5seA86m3Y1zNTpXCpvafPupt0HZVnlYCo",
        alt: "view of earth from orbit with glowing atmospheric haze and city lights at night",
    },
    {
        id: 5,
        name: "Andromeda Gateway",
        subtitle: "Intergalactic Transit • Port 1",
        pinned: false,
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx6VLH1Yu-7zx_pw5w97mK3umiD4yIE_MTEs6HwAHuCjno41pSv_Y_t-b1FxRUHqq3tZeCmFRCqG7S792QUa6syqPFsI-p6tcw2tevkL0ligaYT8G6pkqPmIgm_tg_2f7sGMrNf6NzON4tsd52a7bU2dIpgAQLU8akzithlKTY4zLagYHittZPTPzwDWLtTCTYDYlV-mi6Hcpe7NyPf381CZCsxu59-J6FYZPfC6UGbx8JBUwrV4MFeUXj2LKE4RzG9E0AQtjdIPc",
        alt: "stunning dark space field with millions of sharp white stars and a subtle violet glow",
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }) {
    return (
        <span
            onClick={onClick}
            className={`
        px-4 py-1.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-widest
        cursor-pointer transition-all whitespace-nowrap
        ${
                active
                    ? "bg-surface-container-highest text-[#e0e0fc] hover:bg-primary hover:text-on-primary"
                    : "bg-surface-container text-[#e0e0fc] hover:bg-surface-container-highest"
            }
      `}
        >
      {label}
    </span>
    );
}

function PlaceItem({ place, active, onClick }) {
    const displayName = place.name || place.nome || "Local sem nome";
    const displaySubtitle =
        place.subtitle ||
        [place?.endereco?.logradouro, place?.endereco?.cidade, place?.endereco?.estado]
            .filter(Boolean)
            .join(" - ");

    return (
        <div
            onClick={onClick}
            className={`
        group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer
        transition-all hover:bg-surface-container-high border-l-4
        ${active ? "bg-surface-container border-primary" : "border-transparent"}
      `}
        >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex-shrink-0 overflow-hidden">
                {place.img ? (
                    <img
                        src={place.img}
                        alt={place.alt || displayName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#e0e0fc] opacity-60">
                        <span className="material-symbols-outlined text-base">location_on</span>
                    </div>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#e0e0fc] truncate">{displayName}</h3>
                <p className="text-xs text-[#e0e0fc] opacity-70 truncate">
                    {displaySubtitle || "Endereco nao informado"}
                </p>
            </div>

            {/* Pin icon — only for pinned items */}
            {place.pinned && (
                <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
          push_pin
        </span>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CollectionSidebar({ onClose, isOpen = false }) {
    const [activeFilter, setActiveFilter] = useState("All");
    const [places, setPlaces] = useState(PLACES);
    const [activePlace, setActivePlace] = useState(PLACES[0]?.id || null);

    useEffect(() => {
        let mounted = true;

        LocaisService.getAll()
            .then((response) => response.json())
            .then((data) => {
                if (!mounted || !Array.isArray(data)) return;
                setPlaces(data);
                if (data.length > 0) {
                    setActivePlace(data[0].id);
                }
            })
            .catch(() => {
                // Keeps the mock list as fallback when API is unavailable.
            });

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <>
            {/* Google Fonts + Material Symbols — inject once if not already in the document */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }

        /* Custom scrollbar */
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #313349; border-radius: 10px; }

        /* Hide scrollbar on filter row */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <aside
                className={`fixed left-0 top-0 bottom-0 ml-60 pl-6 w-1/5 bg-[#181A2E] bg-surface-container-low flex flex-col z-0 shadow-2xl text-[#e0e0fc] transition-transform duration-300 ease-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
                }`}
                style={{ fontFamily: "Manrope, sans-serif" }}
            >
                {/* ── Header ── */}
                <div className="px-6 py-8 flex flex-col gap-8">
                    {/* Title row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
              <span
                  className="material-symbols-outlined text-primary text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bookmark
              </span>
                            <h1 className="text-xl font-extrabold tracking-tight text-[#e0e0fc]">
                                Saved Places
                            </h1>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-[#e0e0fc] group"
                        >
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">
                close
              </span>
                        </button>
                    </div>

                    {/* Filter chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {FILTERS.map((f) => (
                            <FilterChip
                                key={f}
                                label={f}
                                active={activeFilter === f}
                                onClick={() => setActiveFilter(f)}
                            />
                        ))}
                    </div>
                </div>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 sidebar-scroll">

                    {places.map((place) => (
                        <PlaceItem
                            key={place.id}
                            place={place}
                            active={activePlace === place.id}
                            onClick={() => setActivePlace(place.id)}
                        />
                    ))}
                </div>

                {/* ── Footer ── */}
                <div className="p-6 bg-surface-container-lowest flex items-center justify-between">
                    <button className="flex items-center gap-2 text-[#e0e0fc] transition-all text-xs font-bold uppercase tracking-widest">
                        <span className="material-symbols-outlined text-lg">add</span>
                        New List
                    </button>
                </div>
            </aside>
        </>
    );
}