
export default function LightRedInfoCard({ reviewNumber, reviewLabel, data}){
    
    const porcentagem = reviewNumber/5 * 100

    return(
        <div className="bg-red-400/5 rounded-2xl p-4 border border-red-400/20">
            <div className="flex justify-between items-start mb-4">
            <h4 className="text-lg font-bold text-red-400 uppercase tracking-widest">
                {data}
            </h4>
            <span className="material-symbols-outlined text-red-400 text-sm">
                trip
            </span>
            </div>
                <div className="relative inline-block text-2xl">
                    {/* Camada de fundo — estrelas vazias */}
                    <div className="text-gray-300">
                        {"★".repeat(5)}
                    </div>

                    {/* Camada de cima — estrelas preenchidas, usa a mesma lógica da barra! */}
                    <div
                        className="absolute top-0 left-0 overflow-hidden text-red-400 transition-all duration-700"
                        style={{ width: `${porcentagem}%` }} // ← mesma lógica!
                    >
                        {"★".repeat(5)}
                    </div>
                </div>
            <div className="flex items-center gap-4">
            <span className="text-xl font-light text-white">{reviewLabel}</span>
            </div>
        </div> 
    )
}