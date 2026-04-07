
import { useState, useEffect, useRef, useCallback } from "react";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import TextOnlyButton from "../button/TextOnlyButton.jsx";
import FormField from "../../components/navlink/Form/FormField.jsx";
import LightRedButton from "../button/LightRedButton.jsx";

export default function CadastroVisita({ idLocalVar, onClose, onSaved }) {

    const [data, setData] = useState("");
    const [avaliacao, setAvaliacao] = useState(0);
    const [comentario, setComentario] = useState("");
    const [hoverAvaliacao, setHoverAvaliacao] = useState(0);
    const [idLocal, setIdLocal] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputClass =
    "w-full bg-[#0a0c20] border-none rounded-lg p-4 text-[#e2e2e2] placeholder:text-[#bbc7dd]/30 focus:ring-0 focus:shadow-[0_0_15px_rgba(255,179,177,0.3)] transition-all duration-300 outline-none";

    function handleDiscard() {
        // Fecha o formulário ao clicar em Discard
        if (onClose) {
            onClose();
        }
    }

      // Chamado ao enviar o formulário
    async function handleSubmit(e) {
        e.preventDefault(); // Impede reload da página (comportamento padrão do HTML)
        setIsSubmitting(true);

        const payload = {
            "dataVisita": data,
            "avaliacao": avaliacao,
            "comentario": comentario,
            "idLocal": idLocalVar
        };

        console.log("Enviando payload para API:", payload);

        try {
        const response = await fetch("http://localhost:8080/api/visita", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
            `Falha ao salvar local (${response.status}): ${errorBody}`,
            );
        }

        if (onSaved) {
            onSaved(idLocalVar);
        }

        if (onClose) {
            onClose();
        }
        } catch (err) {
            console.error("Erro ao enviar local para API:", err);
            window.alert(
                "Nao foi possivel salvar o local. Verifique a API e tente novamente.",
            );
        } finally {
            setIsSubmitting(false);
        }

        // // Chama flyTo após o envio (com ou sem sucesso, desde que tenhamos coords válidas)
        // if (coords && coords.includes(",")) {
        // const [lat, lng] = coords.split(",").map((c) => parseFloat(c.trim()));
        // console.log("Chamando flyTo com coords:", [lat, lng]);
        // flyTo([lat, lng], 17);
        // }
    }

    return(
    <FormSign>
        <div className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
            style={{
                background: "#101225",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
            }}>

			{/* ── Painel esquerdo: informações ── */}
			<div className="w-full md:w-5/12 p-8 bg-[#1c1e32]/40 flex flex-col justify-between">
				<div>
					<span className="text-[#ffb3b1] font-bold tracking-[0.2em] text-[0.6875rem] uppercase mb-4 block">
						Visita
					</span>
					<h2 className="font-['Manrope'] font-extrabold text-4xl text-[#e2e2e2] leading-tight tracking-tight mb-6">
						Crie uma nova visita
					</h2>
					<p className="text-[#bbc7dd]/70 text-sm leading-relaxed">
						Preencha os detalhes da visita para registrar sua experiência no local. Sua avaliação e comentário ajudarão outros visitantes a conhecer melhor o local e planejar suas próprias visitas.
					</p>
				</div>
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-xs text-[#bbc7dd]/50">
						<span className="material-symbols-outlined text-lg">verified_user</span>
						<span>Admin Verified Session</span>
					</div>
				</div>
			</div>

            <div className="w-full bg-[#3b3d55] md:w-7/12 p-10 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
                    <FormField label="Data" icon="date_range">
                        <input
                        className={`${inputClass} pl-12`}
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        />
                    </FormField>

                    <FormField label="Comentário">
                        <textarea
                        className={`${inputClass} min-h-[120px] resize-y whitespace-pre-wrap`}
                        placeholder="Digite seu comentário aqui..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={4}
                        />
                    </FormField>

                    <FormField label="Avaliação" >
                        <div className="flex items-center gap-2" role="radiogroup" aria-label="Avaliação da visita">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`text-4xl transition-colors duration-200 ${star <= (hoverAvaliacao || avaliacao) ? "text-[#ffb3b1]" : "text-[#4a4f6a]"}`}
                                    onClick={() => setAvaliacao(star)}
                                    onMouseEnter={() => setHoverAvaliacao(star)}
                                    onMouseLeave={() => setHoverAvaliacao(0)}
                                    role="radio"
                                    aria-checked={avaliacao === star}
                                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                                >
                                ★
                                </button>
                            ))}
                        </div>
                    </FormField>

                    <div className="flex items-center justify-between pt-4">
                        <TextOnlyButton onClickFunction={handleDiscard}>
                            Voltar
                        </TextOnlyButton>

                        <LightRedButton 
                            type="submit"
                        >
                                {isSubmitting ? "Salvando..." : "Registrando Visita"}
                        </LightRedButton>
                    </div>
                </form>
            </div>
        </div>
    </FormSign>

    )
}