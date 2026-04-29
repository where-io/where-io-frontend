
export default function RedButton({ onClickFunction, symbol, children}){
    return(
        <button
          onClick={onClickFunction}
          className="bg-[#ff535a] text-white py-3 rounded-lg font-bold shadow-lg shadow-[#ff535a]/20 flex items-center justify-center gap-2 mb-4 hover:bg-[#ff3e45] transition-colors"
        >
          <span className="material-symbols-outlined">{symbol}</span>
          <span>{children}</span>
        </button>

    );
}