
import InfoCard from "../grid/InfoCard";
import LightRedInfoCard from "../grid/LightRedInfoCard";
import LightRedButton from "../button/LightRedButton";

// ─── Sub-components ───────────────────────────────────────────────────────────

const LiveBadge = () => (
  <div className="flex items-center gap-2 mb-1">
    <span className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
      Live Status
    </span>
  </div>
);

const LocationHero = ({ name, imageSrc, imageAlt }) => (
  <div className="rounded-2xl overflow-hidden aspect-[4/3] mb-8 relative group">
    <img
      alt={imageAlt}
      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
      src={imageSrc}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute bottom-4 left-4">
      <LiveBadge />
      <h3 className="text-2xl font-black text-white tracking-tight">{name}</h3>
    </div>
  </div>
);

const InfoGrid = ({ coordinates, elevation, visibility }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">
    <InfoCard
      colSpan={2}
      label="Current Coordinates"
      value={coordinates}
      icon="radar"
    />
    {/* <InfoCard label="Elevation" value={elevation} suffix="AMSL" />
    <InfoCard label="Visibility" value={visibility} /> */}
  </div>
);

const ExplorerAvatar = ({ src, alt }) => (
  <img
    alt={alt}
    className="inline-block h-8 w-8 rounded-full ring-2 ring-black object-cover"
    src={src}
  />
);

const ActiveExplorers = ({ explorers, extraCount }) => (
  <div>
    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
      <span className="material-symbols-outlined text-red-400 text-sm">
        group
      </span>
      Active Explorers
    </h4>
    <div className="flex -space-x-3 overflow-hidden">
      {explorers.map((explorer, i) => (
        <ExplorerAvatar key={i} src={explorer.src} alt={explorer.alt} />
      ))}
      {extraCount > 0 && (
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 ring-2 ring-black">
          +{extraCount}
        </div>
      )}
    </div>
  </div>
);

const RouteButton = ({ destination, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5 flex items-center justify-between px-6 group"
  >
    <div className="text-left">
      <span className="text-[10px] text-gray-500 block">Plan Route to</span>
      <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
        {destination}
      </span>
    </div>
    <span className="material-symbols-outlined text-red-400 group-hover:translate-x-1 transition-transform">
      arrow_forward
    </span>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const LOCATION_DATA = {
  name: "Nebula Plaza",
  imageSrc:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD9S_-lg-4hJSjfPrwfQLs6NVz8ersw-lEPKrlS2q9c-WRbfC-UlnzyTwQd_is_HhvSFG9-RP63WNlNTrBTKMBnCk379x-FulI1UdBnl1SW2oGkzHzcM0FTBBDs5m_YoFLsoBroxNshY3y7A57dMxw16mQXzcZcMsmP6zwt1_aQBnBvjrp26_vG6AjKtpEEL5oprnaD7bTl9P5StSn53dBmFHlCXpMV9oi0QwTEgwtFvEmai9jJGJYrx5JVgJe8p4ASu3ALRKUMViU",
  imageAlt:
    "Cyberpunk architecture with neon red lighting and glass structures",
  coordinates: "35.6895° N, 139.6917° E",
  elevation: "422m",
  visibility: "98.4%",
  historicalLog:
    "Constructed in 2088 during the Great Expansion. Nebula Plaza serves as the central neural hub for regional transport and data synchronization across the Deep Space Grid.",
  explorers: [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3DAxd9isdYYEhHeaZQhW6qHBYVeZypHhviSbhnoU97G_zViEM1h_FoZlxqnirkjKUmuGI1-XOvTd4R7HjweMimdCGzx2k6em2qo7_sBjsqsDOraPsLTA_kjnhWPT_Te6ji4musXvtWdXgVix3sHAoV5JlSQH1ZjB2BdpNyuJi9oz7wSjQeth6izpMtIq3bQelmxAbBVr-sF1nxBjeYfvcRH5wzJCbqyY8Kwf01Rvq00uwHUJLABKWv5ia4XViZtZZ2zcy8q1s9-o",
      alt: "Avatar of explorer 1",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJQj2dszZuoChuSO0aQUX98EeGVLRKSeVl-ODQrEk5jDqYBJy77Z0V_rWkOn9aCd1EZ_LJmFbAzzIF8H8N_MPwwfmGrYuqeCdNaccg_c6qzqZmjLdDDN-12XrKXNqEvAv1vFmYMXgVuGwSeN4-EqnNXXD4Ab75Ctifv6toY4tR4al8OYHDHtvhCYfzHYWnICw-EHHIeCMtzgv1fLmejJKJIuZwfcNXEyYuKog4CL_qtRzB9J6FBxzcM2tteEvO-QPRxqcZ-DbzsCg",
      alt: "Avatar of explorer 2",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5dCUhqyImJUH6Iy2eWl-539x7YuxOPhiDScIWoWtmT3Zi-ipKfB6zem-FPzE3Jl3pPnhzNqdWzq8gmnPU9j_wTij0C-OeRKAH1bk5swMY8Q7fLnDxWMcJjLdyTZI-3QsKkhLBPHMxGA3APyxD_9L6wNoljJrdPGbAnazES3ns3rsxVGg_MPHG18tS418SzIbhWbwV6J5gBT6pdjPpmchMV6JMA9NTBfG_U95u0DrRmM0",
      alt: "Avatar of explorer 3",
    },
  ],
  extraExplorers: 12,
  weather: {
    temperature: "-4°C",
    densityLabel: "Atmospheric Density: High",
    densityPercent: 66,
  },
};

export default function LocationSidebar({
  data,
  onClose,
  onAddVisit,
  isOpen = true,
  visitas = []
}) {
  const resolvedData = {
    ...LOCATION_DATA,
    ...(data || {}),
    weather: {
      ...LOCATION_DATA.weather,
      ...(data?.weather || {}),
    },
    explorers:
      Array.isArray(data?.explorers) && data.explorers.length > 0
        ? data.explorers
        : LOCATION_DATA.explorers,
    extraExplorers: data?.extraExplorers ?? LOCATION_DATA.extraExplorers,
  };

  return (
    <aside
      className={`fixed right-0 top-0 h-full w-1/4 backdrop-blur-3xl z-40 border-l border-white/5 pt-20 flex flex-col bg-[#101225] transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      )}
      <div className="p-8 flex-1 overflow-y-auto space-y-0">
        <LocationHero
          name={resolvedData.name}
          imageSrc={resolvedData.imageSrc}
          imageAlt={resolvedData.imageAlt}
        />

        <InfoGrid
          coordinates={resolvedData.coordinates}
          elevation={resolvedData.elevation}
          visibility={resolvedData.visibility}
        />

        <section className="space-y-6 pt-4">
          <div>
            <div className="flex justify-between items-center mb-4 align-middle">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400 text-s">
                  history_edu
                </span>
                Visitas
              </h4>
              <LightRedButton onClickFunction={onAddVisit} type="button">
                Adicionar Visita
              </LightRedButton>
            </div>
          </div>
          {
            visitas.map((visita, index) => (
            <LightRedInfoCard
                key={visita.id ?? index}
                data={new Date(visita.dataVisita).toLocaleDateString("pt-BR")}
                // horario={visita.horario}
                reviewLabel={visita.comentario}
                reviewNumber={visita.avaliacao}
              />
            ))
          }
        </section>
      </div>

      {/* Footer */}
      <div className="p-8 pt-0">
        <RouteButton destination={resolvedData.name} onClick={() => {}} />
      </div>
    </aside>
  );
}
