import { useMemo, useState } from "react";

const FRIENDS = [
  { id: 1, initials: "DM", name: "Diogo M.", location: "Sao Paulo", distance: "1.2km daqui", online: true },
  { id: 2, initials: "NA", name: "Nina A.", location: "Inativa", distance: "", online: false },
  { id: 3, initials: "LC", name: "Lucas C.", location: "Osasco", distance: "2.9km daqui", online: true },
  { id: 4, initials: "MP", name: "Marina P.", location: "Pinheiros", distance: "4.1km daqui", online: true },
];

function FriendRow({ friend }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.01)",
      }}
    >
      <div style={{ position: "relative", width: 34, height: 34 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: "white",
            background: "linear-gradient(145deg, var(--violet), var(--coral))",
          }}
        >
          {friend.initials}
        </div>
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 9,
            height: 9,
            borderRadius: "50%",
            border: "2px solid var(--bg-2)",
            background: friend.online ? "var(--aqua)" : "var(--ink-4)",
          }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{friend.name}</div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {friend.location}
          {friend.distance ? ` · ${friend.distance}` : ""}
        </div>
      </div>

      <button
        style={{
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "transparent",
          color: "var(--ink-2)",
          fontSize: 11,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        DM
      </button>
    </div>
  );
}

export default function FriendsSidebar({ isOpen = false, onClose }) {
  const [query, setQuery] = useState("");

  const filteredFriends = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return FRIENDS;
    return FRIENDS.filter((friend) => friend.name.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: 274,
        width: 320,
        maxHeight: "calc(100vh - 140px)",
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 35,
        boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
        transform: isOpen ? "translateX(0) scale(1)" : "translateX(-16px) scale(0.97)",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
    >
      <div
        style={{
          padding: "18px 20px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--coral)" }}>
          people
        </span>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 17,
            flex: 1,
            color: "var(--ink)",
          }}
        >
          Friends
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ink-3)" }}>
          {filteredFriends.length}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "transparent",
            border: "1px solid var(--line)",
            color: "var(--ink-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line-soft)" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--coral)",
            marginBottom: 8,
          }}
        >
          Presence sidebar block
        </div>
        <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 12, lineHeight: 1.45 }}>
          Amigos online. Avatares com gradiente, dot de status e localizacao aproximada.
        </p>
      </div>

      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-soft)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "9px 12px",
            background: "var(--bg-4)",
            borderRadius: 10,
            color: "var(--ink-3)",
            fontSize: 12,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13, flexShrink: 0 }}>
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar amigo..."
            style={{
              border: 0,
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontSize: 12,
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gap: 8 }} className="sidebar-scroll">
        {filteredFriends.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-3)", fontSize: 13 }}>
            Nenhum amigo encontrado
          </div>
        ) : (
          filteredFriends.map((friend) => <FriendRow key={friend.id} friend={friend} />)
        )}
      </div>
    </div>
  );
}
