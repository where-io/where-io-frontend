
import NavLink from "../../components/navlink/NavLink.jsx";
import RedButton from '../button/RedButton.jsx'


export default function SideNavBar({ onAddLocation, onOpenSavedPlaces, activeNav }) {
  const navItems = [
    { icon: "explore", label: "Explore", active: activeNav === "Explore" },
    {
      icon: "library_add",
      label: "Coleção",
      onClick: onOpenSavedPlaces,
      active: activeNav === "Lugares Salvos",
    },
    { icon: "people", label: "Amigos", active: activeNav === "Coleções" },
    // { icon: "history", label: "Recent" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-[#101225] flex flex-col p-6 gap-y-2 z-50 rounded-r-lg shadow-none font-['Manrope'] font-medium text-sm hidden md:flex z-1">
      {/* Logo / Título */}
      <div className="text-lg font-black text-[#edf2f4] mb-8">
        WHERE-<span className="text-[#ef233c]">io</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8d99ae] font-normal mt-1">
          Navigation System
        </p>
      </div>

      {/* Itens de navegação — renderizados com .map() */}
      {navItems.map((item) => (
        <NavLink key={item.label} {...item} />
      ))}

      {/* Rodapé da sidebar */}
      <div className="mt-auto flex flex-col gap-2">
        <RedButton onClickFunction={onAddLocation} label="Adicionar Local" symbol="add">
          Adicionar Local
        </RedButton>
        <a href="#" className="text-[#8d99ae] px-4 py-2 hover:text-[#edf2f4] flex items-center gap-3 transition-all">
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </a>
        <a href="#" className="text-[#8d99ae] px-4 py-2 hover:text-[#edf2f4] flex items-center gap-3 transition-all">
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </a>
      </div>
    </nav>
  );
}