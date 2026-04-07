
export default function FormField({ label, icon, children }){
    return(
        <div className="group mb-4">
            <label className="block text-[0.6875rem] font-bold text-[#bbc7dd]/60 uppercase tracking-widest mb-2 px-1">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bbc7dd]/40 pointer-events-none"
                    aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}
                {children}
            </div>
        </div>
    );
}