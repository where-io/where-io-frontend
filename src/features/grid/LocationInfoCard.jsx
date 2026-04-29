
export default function LocationInfoCard({ label, value, suffix, icon, colSpan = 1 }){
    return(
        <div
            className={`${colSpan === 2 ? "col-span-2" : ""
            } bg-white/5 p-4 rounded-2xl border border-white/5`}
        >
            <span className="text-[10px] text-gray-400 uppercase tracking-tighter block mb-1">
            {label}
            </span>
            <div className="flex justify-between items-end">
            <span className="text-lg font-bold text-white font-mono">
                {value}{" "}
                {suffix && (
                <span className="text-xs font-normal text-gray-500">{suffix}</span>
                )}
            </span>
            {icon && (
                <span className="material-symbols-outlined text-red-400/40">{icon}</span>
            )}
            </div>
        </div>
    )
}