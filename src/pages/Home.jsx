import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../App.css";
import Mapa from "../features/mapa/Mapa.jsx";
import { MapActionsProvider } from "../features/mapa/MapContext.jsx";
import Sidebar from "../features/sidebar/SideBar.jsx";
import LocationSidebar from "../features/sidebar/LocationSidebar.jsx";
import CollectionSidebar from "../features/sidebar/CollectionSidebar.jsx";
import FriendsSidebar from "../features/sidebar/FriendsSidebar.jsx";
import SettingsModal from "../features/sidebar/SettingsModal.jsx";
import CadastroLocal from "../features/cadastroLocal/CadastroLocal.jsx";
import CadastroVisita from "../features/cadastroVisita/CadastroVisita.jsx";
import {LocaisService} from "../service/LocaisService";
import {VisitaService} from "../service/VisitaService";

function Home() {
    const [showCadastroLocal, setShowCadastroLocal] = useState(false);
    const [showCadastroVisitas, setShowCadastroVisitas] = useState(false);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLocationSidebarOpen, setIsLocationSidebarOpen] = useState(false);
    const [visitas, setVisitas] = useState([]);
    const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("Explore");
    const closeSidebarTimeoutRef = useRef(null);

    const openCadastroLocal = () => setShowCadastroLocal(true);
    const closeCadastroLocal = () => setShowCadastroLocal(false);

    const openCadastroVisitas = () => setShowCadastroVisitas(true);
    const closeCadastroVisitas = () => setShowCadastroVisitas(false);

    const fetchVisitas = useCallback((localId) => {
        if (!localId) return;

        VisitaService.getById(localId)
            .then((response) => response.json())
            .then((data) => setVisitas(data))
            .catch((error) => console.error("Error fetching visits:", error));
    }, []);

    const fetchLocations = useCallback(() => {

        LocaisService.getAll()
            .then((res) => res.json())
            .then((data) => setLocations(data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        if (selectedLocation) {
            setIsLocationSidebarOpen(true);
        }
    }, [selectedLocation]);

    useEffect(() => {
        if (!isLocationSidebarOpen || !selectedLocation?.id) return;
        fetchVisitas(selectedLocation.id);
    }, [fetchVisitas, isLocationSidebarOpen, selectedLocation?.id]);

    useEffect(() => {
        return () => {
            if (closeSidebarTimeoutRef.current) {
                clearTimeout(closeSidebarTimeoutRef.current);
            }
        };
    }, []);

    const handleLocationSelect = useCallback((location) => {
        if (closeSidebarTimeoutRef.current) {
            clearTimeout(closeSidebarTimeoutRef.current);
        }

        setSelectedLocation(location);
        setIsLocationSidebarOpen(true);
    }, []);

    const selectedLocationData = useMemo(() => {
        if (!selectedLocation) return null;

        const lat = selectedLocation?.coordenadas?.latitude;
        const lng = selectedLocation?.coordenadas?.longitude;
        const coordinates = lat && lng ? `${lat}, ${lng}` : "—";

        return {
            name: selectedLocation?.nome || "Local selecionado",
            imageSrc:
                selectedLocation?.imagemUrl ||
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
            imageAlt: selectedLocation?.nome || "Local selecionado",
            coordinates,
            elevation: selectedLocation?.elevacao || "—",
            visibility: selectedLocation?.visibilidade || "—",
            historicalLog:
                selectedLocation?.descricao || "Sem informacoes adicionais.",
            weather: {
                temperature: selectedLocation?.temperatura || "—",
                densityLabel:
                    selectedLocation?.densidadeLabel || "Atmospheric Density: —",
                densityPercent: selectedLocation?.densidadePercent || 0,
            },
        };
    }, [selectedLocation]);

    return (
        <MapActionsProvider>
            <div className="">
                <Mapa
                    locations={locations}
                    onLocationSelect={handleLocationSelect}
                />
                <Sidebar
                    onAddLocation={openCadastroLocal}
                    onOpenSavedPlaces={() => {
                        setIsSavedPlacesOpen(true);
                        setIsFriendsOpen(false);
                        setActiveNav("Lugares Salvos");
                    }}
                    onOpenFriends={() => {
                        setIsFriendsOpen(true);
                        setIsSavedPlacesOpen(false);
                        setActiveNav("Amigos");
                    }}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    activeNav={activeNav}
                />
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                />
                <CollectionSidebar
                    isOpen={isSavedPlacesOpen}
                    selectedPlaceId={selectedLocation?.id}
                    onPlaceSelect={handleLocationSelect}
                    onClose={() => {
                        setIsSavedPlacesOpen(false);
                        setActiveNav("Explore");
                    }}
                />
                <FriendsSidebar
                    isOpen={isFriendsOpen}
                    onClose={() => {
                        setIsFriendsOpen(false);
                        setActiveNav("Explore");
                    }}
                />
                {selectedLocationData && (
                    <LocationSidebar
                        data={selectedLocationData}
                        onAddVisit={openCadastroVisitas}
                        onClose={() => {
                            setIsLocationSidebarOpen(false);
                            closeSidebarTimeoutRef.current = setTimeout(() => {
                                setSelectedLocation(null);
                            }, 300);
                        }}
                        isOpen={isLocationSidebarOpen}
                        visitas={visitas}
                    />
                )}
                {showCadastroLocal && (
                    <CadastroLocal onClose={closeCadastroLocal} onSaved={fetchLocations} />
                )}
                {showCadastroVisitas && (
                    <CadastroVisita
                        idLocalVar={selectedLocation?.id}
                        onClose={closeCadastroVisitas}
                        onSaved={fetchVisitas}
                    />
                )}
            </div>
        </MapActionsProvider>
    );
}

export default Home;
