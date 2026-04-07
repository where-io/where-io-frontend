
export default function TextOnlyButton({ onClickFunction, children}){
    return(
        <button
        type="button"
        onClick={onClickFunction}
        className="text-[#bbc7dd]/60 text-sm font-medium hover:text-[#e2e2e2] transition-colors"
        >
            {children}
        </button>
    )
}