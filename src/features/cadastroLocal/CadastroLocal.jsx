import { useState, useEffect, useRef, useCallback } from "react";

import { useMapActions } from "../mapa/MapContext.jsx";
import LightRedButton from "../button/LightRedButton.jsx";
import TextOnlyButton from "../button/TextOnlyButton.jsx";
import FormSign from "../../components/navlink/Form/FormSign.jsx";
import FormField from "../../components/navlink/Form/FormField.jsx";
import {LocaisService} from "../../service/LocaisService";

// ============================================================
// 🧩 COMPONENTE 1: useGooglePlaces (Custom Hook)
//
// O que é um Custom Hook?
// É uma função que começa com "use" e encapsula lógica reutilizável.
// Aqui isolamos TODA a lógica do Google Maps nesse hook,
// deixando o componente visual limpo e focado apenas na UI.
//
// Exemplo de analogia:
// Sem hook → receita de bolo junto com a decoração
// Com hook → receita separada da decoração (cada um no seu lugar)
// ============================================================
function useGooglePlaces() {
  // useRef guarda um valor que NÃO re-renderiza o componente quando muda.
  // Ideal para guardar instâncias de APIs externas como o sessionToken.
  const sessionTokenRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // useEffect roda código após o componente aparecer na tela.
  // O [] no final significa: rode apenas UMA vez (quando montar).
  useEffect(() => {
    async function init() {
      try {
        const { AutocompleteSessionToken } =
          await window.google.maps.importLibrary("places");
        sessionTokenRef.current = new AutocompleteSessionToken();
        setIsReady(true);
      } catch (err) {
        console.error("Google Maps não carregou:", err);
      }
    }

    // Aguarda o Google Maps estar disponível no window
    if (window.google?.maps) {
      init();
    } else {
      window.addEventListener("load", init);
      return () => window.removeEventListener("load", init);
    }
  }, []);

  // useCallback evita recriar a função a cada re-renderização.
  // É uma otimização importante para funções passadas como props.
  const fetchSuggestions = useCallback(
    async (query) => {
      if (!isReady || query.length <= 3) return [];

      try {
        const { AutocompleteSuggestion } =
          await window.google.maps.importLibrary("places");
        const { suggestions } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ["br"],
          });
        return suggestions || [];
      } catch (err) {
        console.error("Erro no autocomplete:", err);
        return [];
      }
    },
    [isReady],
  );

  const fetchPlaceDetails = useCallback(async (placeId) => {
    try {
      const { Place, AutocompleteSessionToken } =
        await window.google.maps.importLibrary("places");

      const place = new Place({ id: placeId, requestedLanguage: "pt-BR" });
      await place.fetchFields({
        fields: [
          "location",
          "displayName",
          "formattedAddress",
          "addressComponents",
        ],
      });

      // Reseta o token após selecionar (cada busca completa deve ter um token novo)
      sessionTokenRef.current = new AutocompleteSessionToken();

      return {
        address: place.formattedAddress,
        coords: `${place.location.lat()}, ${place.location.lng()}`,
        name: place.displayName,
      };
    } catch (err) {
      console.error("Erro ao buscar detalhes:", err);
      return null;
    }
  }, []);

  return { fetchSuggestions, fetchPlaceDetails, isReady };
}

// ============================================================
// 🧩 COMPONENTE 2: SuggestionsList
//
// Componente puro de UI — só recebe dados e exibe.
// Não sabe nada sobre Google Maps, só renderiza a lista.
//
// Props recebidas:
// - suggestions: array de sugestões
// - onSelect: função chamada ao clicar em uma sugestão
// ============================================================
function SuggestionsList({ suggestions, onSelect }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-50 w-full mt-2 rounded-lg overflow-hidden shadow-2xl bg-[#1a1c1e] border border-white/10">
      {suggestions.map((suggestion) => {
        const p = suggestion.placePrediction;
        return (
          <div
            key={p.placeId}
            onClick={() => onSelect(p.placeId)}
            className="px-4 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 transition-colors flex flex-col"
          >
            <strong className="text-[#e2e2e2] text-sm">
              {p.mainText.text}
            </strong>
            <small className="text-white/40 text-xs">
              {p.secondaryText.text}
            </small>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 🧩 COMPONENTE 4: CreateLocationForm (Componente Principal)
//
// Aqui ficam todos os estados do formulário.
// Usa os componentes acima como peças de montagem.
//
// Estados gerenciados:
// - query: texto digitado no campo de busca
// - suggestions: lista de sugestões do Google
// - address, coords, description: valores dos campos
// - isSubmitting: controla o botão de envio
// ============================================================
export default function CadastroLocal({ onClose, onSaved }) {
  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:8080/api/local";
  const ignoreNextQueryRef = useRef(false);
  const { flyTo } = useMapActions();

  // useState: cada campo do formulário tem seu próprio estado
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usa o custom hook — toda lógica do Maps fica aqui
  const { fetchSuggestions, fetchPlaceDetails } = useGooglePlaces();

  // Roda sempre que "query" muda (busca sugestões automaticamente)
  useEffect(() => {
    if (ignoreNextQueryRef.current) {
      ignoreNextQueryRef.current = false;
      return;
    }

    if (query.length > 3) {
      fetchSuggestions(query).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchSuggestions]);

  // Chamado quando o usuário clica em uma sugestão
  async function handleSelectPlace(placeId) {
    const details = await fetchPlaceDetails(placeId);
    if (details) {
      setAddress(details.address);
      setCoords(details.coords);
      setDescription(`Anchor established at ${details.name}`);
      ignoreNextQueryRef.current = true;
      setQuery(details.address);
      setSuggestions([]); // Fecha a lista após seleção
    }
  }

  // Chamado ao enviar o formulário
  async function handleSubmit(e) {
    e.preventDefault(); // Impede reload da página (comportamento padrão do HTML)
    setIsSubmitting(true);

    console.log(address);

    const enderecoParsed = parseEndereco(address);

    const payload = {
      nome: name,
      endereco: {
        logradouro: enderecoParsed.rua,
        bairro: enderecoParsed.bairro,
        cidade: enderecoParsed.cidade,
        estado: enderecoParsed.estado,
        cep: enderecoParsed.cep,
        pais: "Brasil",
      },
      coordenadas: {
        latitude: coords.split(",")[0].trim(),
        longitude: coords.split(",")[1].trim(),
      },
      descricao: description,
    };

    const response = await LocaisService.create(payload)

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
        `Falha ao salvar local (${response.status}): ${errorBody}`,
        );
    }

    if (onSaved) {
        onSaved();
    }

    if (onClose) {
        onClose();
    }

    setIsSubmitting(false);

    // Chama flyTo após o envio (com ou sem sucesso, desde que tenhamos coords válidas)
    if (coords && coords.includes(",")) {
        const [lat, lng] = coords.split(",").map((c) => parseFloat(c.trim()));
        console.log("Chamando flyTo com coords:", [lat, lng]);
        flyTo([lat, lng], 17);
    }
  }

  function parseEndereco(enderecoCompleto) {
    const semBrasil = enderecoCompleto.replace(/, Brasil\.?$/, "").trim();

    const cepMatch = semBrasil.match(/(\d{5}-\d{3})/);
    const cep = cepMatch ? cepMatch[1] : null;

    const semCep = semBrasil.replace(/,?\s*\d{5}-\d{3}/, "").trim();

    const partes = semCep.split(" - ");

    // Rua e número sempre no primeiro elemento
    const primeiraParte = partes[0];
    const [rua, numero] = primeiraParte.split(",").map((s) => s.trim());
    const numeroLimpo = numero && /^\d+/.test(numero) ? numero : null;

    // ✅ Estado sempre é o ÚLTIMO elemento
    const estado = partes[partes.length - 1].trim();

    // ✅ Bairro e cidade ficam nos elementos do meio
    const meioRaw = partes.slice(1, partes.length - 1).join(" - ");
    const meioParts = meioRaw.split(",").map((s) => s.trim());
    const bairro = meioParts[0] || null;
    const cidade = meioParts[1] || null;

    return {
      rua: rua || null,
      numero: numeroLimpo,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
    };
  }

  function handleDiscard() {
    setQuery("");
    setAddress("");
    setCoords("");
    setDescription("");
    setSuggestions([]);

    // Fecha o formulário ao clicar em Discard
    if (onClose) {
      onClose();
    }
  }

  // Estilos reutilizáveis para os inputs (evita repetição)
  const inputClass =
    "w-full bg-[#0a0c20] border-none rounded-lg p-4 text-[#e2e2e2] placeholder:text-[#bbc7dd]/30 focus:ring-0 focus:shadow-[0_0_15px_rgba(255,179,177,0.3)] transition-all duration-300 outline-none";

  return (
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
						New Protocol
					</span>
					<h2 className="font-['Manrope'] font-extrabold text-4xl text-[#e2e2e2] leading-tight tracking-tight mb-6">
						Create Location
					</h2>
					<p className="text-[#bbc7dd]/70 text-sm leading-relaxed">
						Establish a new navigational anchor in the cosmic atlas. Define
						coordinates and metadata for orbital synchronicity.
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
					{/* Campo de busca com autocomplete */}
					<div className="group relative">
						<div className="pb-7">
							<FormField label="Nome">
							<input
								className={inputClass}
								placeholder="Search celestial coordinates..."
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							</FormField>
						</div>

						<FormField label="Endereço">
							<input
							className={inputClass}
							placeholder="Search celestial coordinates..."
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							/>
						</FormField>

						{/* Lista de sugestões — aparece/some conforme "suggestions" */}
						<SuggestionsList
							suggestions={suggestions}
							onSelect={handleSelectPlace}
						/>
					</div>

					{/* Campo de coordenadas (preenchido automaticamente) */}
					<FormField label="Coordinates" icon="location_searching">
						<input
							className={`${inputClass} pl-12`}
							placeholder="Waiting for selection..."
							type="text"
							value={coords}
							onChange={(e) => setCoords(e.target.value)}
							readOnly
						/>
					</FormField>

					{/* Campo de descrição */}
					<FormField label="Description">
						<textarea
							className={`${inputClass} resize-none`}
							placeholder="Brief overview of the celestial destination..."
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</FormField>

					{/* Botões */}

					<div className="flex items-center justify-between pt-4">
						<TextOnlyButton onClickFunction={handleDiscard}>
							Voltar
						</TextOnlyButton>

						<LightRedButton 
              type="submit"
						>
							{isSubmitting ? "Salvando..." : "Registrando Local"}
						</LightRedButton>
					</div>
				</form>
			</div>
		</div>
    </FormSign>
  );
}
