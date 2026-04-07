
import { useState } from "react";

export default function NavLink({ icon, label, active = false, onClick }) {
  return (
    <a
      href="#"
      onClick={(event) => {
        if (onClick) {
          event.preventDefault();
          onClick();
        }
      }}
      className={
        active
          ? "bg-gradient-to-r from-[#ef233c] to-[#ff535a] text-white rounded-lg px-4 py-3 shadow-lg shadow-[#ef233c]/20 flex items-center gap-3 transition-all"
          : "text-[#8d99ae] px-4 py-3 hover:bg-[#1c1e32] rounded-lg hover:text-[#edf2f4] flex items-center gap-3 transition-all hover:translate-x-1 duration-200"
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </a>
  );
}