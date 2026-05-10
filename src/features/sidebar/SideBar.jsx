import { useNavigate } from "react-router-dom";
import NavLink from "../../components/navlink/NavLink.jsx";
import RedButton from '../button/RedButton.jsx';
import { useAuth } from "../../context/AuthContext.jsx";

export default function SideNavBar({
  onAddLocation,
  onOpenSavedPlaces,
  onOpenFriends,
  onOpenSettings,
  onExplore,
  activeNav,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  const mainNav = [
    { icon: "explore", label: "Explore", active: activeNav === "Explore", onClick: onExplore },
    { icon: "bookmark", label: "Coleção",   active: activeNav === "Lugares Salvos", onClick: onOpenSavedPlaces },
    { icon: "people",   label: "Amigos",    active: activeNav === "Amigos", onClick: onOpenFriends },
  ];

  const footerNav = [
    { icon: "settings", label: "Settings", onClick: onOpenSettings },
    { icon: "logout", label: "Sair", onClick: handleLogout },
    { icon: "help",     label: "Help" },
  ];

  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, height: '100%', width: 256,
      background: 'var(--bg-1)', borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      padding: '28px 18px 22px', zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ padding: '0 8px 28px' }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22,
          letterSpacing: '-0.01em', color: 'var(--ink)',
        }}>
          WHERE<span style={{ color: 'var(--coral)' }}>·io</span>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: 'var(--tracking)', color: 'var(--ink-3)',
          textTransform: 'uppercase', marginTop: 6,
        }}>
          // navigation system
        </div>
      </div>

      {/* Main nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mainNav.map(item => <NavLink key={item.label} {...item} />)}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Add button */}
      <RedButton onClickFunction={onAddLocation}>Adicionar Local</RedButton>

      {/* Footer nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
        {footerNav.map(item => (
          <NavLink key={item.label} icon={item.icon} label={item.label} onClick={item.onClick} />
        ))}
      </div>
    </nav>
  );
}
