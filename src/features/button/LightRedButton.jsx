
export default function LightRedButton({ type, onClickFunction, children}){

    return(
        <button
        type={type}
        onClick={onClickFunction}
        className="bg-gradient-to-tr from-[#ffb3b1] to-[#ff535a] px-8 py-3 rounded-lg text-[#680011] font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {children}
        </button>
    )
}