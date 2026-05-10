import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { AmigosService } from "../../service/AmigosService.js";
import {
  decodeJwtPayload,
  displayNameFromJwtClaims,
  initialsFromUser,
} from "../../service/jwtDecode.js";

function FriendRow({ friend }) {
  const name = friend.nome || friend.name || "Sem nome";
  const handle = friend.nomeUsuario ? `@${friend.nomeUsuario}` : "";
  const sub =
    [handle, friend.email, [friend.location, friend.distance].filter(Boolean).join(" · ")]
      .filter(Boolean)
      .join(" · ") || "";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38px 1fr",
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
          {friend.initials || initialsFromUser(name, friend.email)}
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
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{name}</div>
        {sub ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InviteReceivedRow({ invite, onAceitar, onRecusar, busy }) {
  const nomeRemetente = invite.nome || "—";
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.01)",
        border: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        Convite recebido
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          marginBottom: 10,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={nomeRemetente}
      >
        De · {nomeRemetente}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAceitar(invite.id)}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(94,224,200,0.35)",
            background: "rgba(94,224,200,0.12)",
            color: "var(--aqua)",
            fontSize: 11,
            fontWeight: 700,
            padding: "6px 12px",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          Aceitar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRecusar(invite.id)}
          style={{
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--ink-2)",
            fontSize: 11,
            fontWeight: 600,
            padding: "6px 12px",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          Recusar
        </button>
      </div>
    </div>
  );
}

function InviteSentRow({ invite, onCancelar, busy }) {
  const nomeDestinatario = invite.nome || "—";
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.01)",
        border: "1px solid var(--line-soft)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        Convite enviado
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          marginBottom: 10,
          fontFamily: "'Space Grotesk', sans-serif",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={nomeDestinatario}
      >
        Para · {nomeDestinatario}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => onCancelar(invite.id)}
        style={{
          borderRadius: 999,
          border: "1px solid rgba(255,107,94,0.22)",
          background: "rgba(255,107,94,0.08)",
          color: "var(--coral)",
          fontSize: 11,
          fontWeight: 700,
          padding: "6px 12px",
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        Cancelar convite
      </button>
    </div>
  );
}

export default function FriendsSidebar({ isOpen = false, onClose }) {
  const { auth } = useAuth();
  const claims = useMemo(() => decodeJwtPayload(auth?.accessToken), [auth?.accessToken]);
  const meName = displayNameFromJwtClaims(claims);
  const meEmail = claims?.email || "";
  const meInitials = initialsFromUser(meName, meEmail);

  const [listTab, setListTab] = useState("friends");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [recebidos, setRecebidos] = useState([]);
  const [enviados, setEnviados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [frRes, rcRes, enRes] = await Promise.all([
        AmigosService.listFriends(),
        AmigosService.listConvitesRecebidos(),
        AmigosService.listConvitesEnviados(),
      ]);

      if (!frRes.ok) {
        const t = await frRes.text().catch(() => "");
        throw new Error(t || `Amigos (${frRes.status})`);
      }
      if (!rcRes.ok) {
        const t = await rcRes.text().catch(() => "");
        throw new Error(t || `Convites recebidos (${rcRes.status})`);
      }
      if (!enRes.ok) {
        const t = await enRes.text().catch(() => "");
        throw new Error(t || `Convites enviados (${enRes.status})`);
      }

      const frJson = await frRes.json();
      const rcJson = await rcRes.json();
      const enJson = await enRes.json();

      setFriends(Array.isArray(frJson) ? frJson : []);
      setRecebidos(Array.isArray(rcJson) ? rcJson : []);
      setEnviados(Array.isArray(enJson) ? enJson : []);
    } catch (e) {
      setFriends([]);
      setRecebidos([]);
      setEnviados([]);
      setError(e?.message || "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadLists();
  }, [isOpen, loadLists]);

  const filteredFriends = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return friends;
    return friends.filter((friend) => {
      const nome = (friend.nome || "").toLowerCase();
      const email = (friend.email || "").toLowerCase();
      const nu = (friend.nomeUsuario || "").toLowerCase();
      return (
        nome.includes(normalized) ||
        email.includes(normalized) ||
        nu.includes(normalized)
      );
    });
  }, [friends, query]);

  const pendingTotal = recebidos.length + enviados.length;

  const headerCount =
    listTab === "friends"
      ? query.trim()
        ? filteredFriends.length
        : friends.length
      : pendingTotal;

  async function handleAceitar(id) {
    setActionBusy(true);
    try {
      const res = await AmigosService.aceitarConvite(id);
      if (res.ok) await loadLists();
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRecusarOuCancelar(id) {
    setActionBusy(true);
    try {
      const res = await AmigosService.cancelarOuRecusarConvite(id);
      if (res.ok) await loadLists();
    } finally {
      setActionBusy(false);
    }
  }

  async function handleEnviarConvite() {
    const nome = inviteUsername.trim();
    if (!nome) {
      setInviteFeedback({ type: "err", text: "Informe o nome de usuário." });
      return;
    }
    setInviteBusy(true);
    setInviteFeedback(null);
    try {
      const res = await AmigosService.enviarConvite(nome);
      const raw = await res.text().catch(() => "");
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw || `Erro (${res.status})` };
      }
      if (res.ok) {
        setInviteFeedback({
          type: "ok",
          text: data.mensagem || "Convite enviado com sucesso.",
        });
        setInviteUsername("");
        await loadLists();
      } else {
        setInviteFeedback({
          type: "err",
          text: data.message || data.mensagem || `Não foi possível enviar (${res.status}).`,
        });
      }
    } catch (e) {
      setInviteFeedback({
        type: "err",
        text: e?.message || "Falha ao enviar convite.",
      });
    } finally {
      setInviteBusy(false);
    }
  }

  const isPendingTab = listTab === "pending";

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
          {loading ? "…" : headerCount}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: "white",
                background: "linear-gradient(145deg, var(--aqua), var(--violet))",
              }}
            >
              {meInitials}
            </div>
            <span
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "2px solid var(--bg-2)",
                background: "var(--aqua)",
              }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                marginBottom: 4,
              }}
            >
              Conectado como
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--ink)",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meName}
            </div>
            {meEmail ? (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {meEmail}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            position: "relative",
            background: "var(--bg-3)",
            border: "1px solid var(--line)",
            borderRadius: 999,
            padding: 3,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 3,
              bottom: 3,
              left: 3,
              width: "calc((100% - 6px) / 2)",
              borderRadius: 999,
              background: "var(--coral)",
              boxShadow: "0 4px 12px -4px var(--coral-glow)",
              transform: isPendingTab ? "translateX(100%)" : "translateX(0)",
              transition: "transform 0.28s cubic-bezier(0.34, 1.34, 0.64, 1)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <button
            type="button"
            onClick={() => setListTab("friends")}
            style={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              padding: "7px 12px",
              borderRadius: 999,
              border: 0,
              background: "transparent",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              color: !isPendingTab ? "white" : "var(--ink-3)",
              transition: "color 0.2s ease",
            }}
          >
            Amigos
          </button>
          <button
            type="button"
            onClick={() => setListTab("pending")}
            style={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              padding: "7px 12px",
              borderRadius: 999,
              border: 0,
              background: "transparent",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              color: isPendingTab ? "white" : "var(--ink-3)",
              transition: "color 0.2s ease",
            }}
          >
            Pendentes
            {pendingTotal > 0 ? (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, marginLeft: 6, opacity: 0.95 }}>
                ({pendingTotal})
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {!isPendingTab ? (
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--line-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
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
            <button
              type="button"
              title="Adicionar amigo"
              aria-expanded={addFriendOpen}
              aria-label={addFriendOpen ? "Fechar convite" : "Adicionar amigo"}
              onClick={() => {
                setAddFriendOpen((v) => !v);
                setInviteFeedback(null);
              }}
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 10,
                border: addFriendOpen ? "1px solid rgba(255,179,177,0.45)" : "1px solid var(--line)",
                background: addFriendOpen ? "rgba(255,179,177,0.1)" : "var(--bg-3)",
                color: addFriendOpen ? "var(--coral)" : "var(--ink-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                person_add
              </span>
            </button>
          </div>
          {addFriendOpen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEnviarConvite();
                  }}
                  placeholder="Nome de usuário"
                  disabled={inviteBusy}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--bg-4)",
                    color: "var(--ink)",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  disabled={inviteBusy}
                  onClick={handleEnviarConvite}
                  style={{
                    flexShrink: 0,
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(94,224,200,0.35)",
                    background: "rgba(94,224,200,0.12)",
                    color: "var(--aqua)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: inviteBusy ? "default" : "pointer",
                    opacity: inviteBusy ? 0.65 : 1,
                  }}
                >
                  {inviteBusy ? "…" : "Convidar"}
                </button>
              </div>
              {inviteFeedback ? (
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.45,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border:
                      inviteFeedback.type === "ok"
                        ? "1px solid rgba(94,224,200,0.28)"
                        : "1px solid rgba(255,107,94,0.25)",
                    background:
                      inviteFeedback.type === "ok"
                        ? "rgba(94,224,200,0.08)"
                        : "rgba(255,107,94,0.08)",
                    color: inviteFeedback.type === "ok" ? "var(--aqua)" : "var(--coral)",
                  }}
                >
                  {inviteFeedback.text}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gap: 8 }} className="sidebar-scroll">
        {error ? (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,107,94,0.08)", border: "1px solid rgba(255,107,94,0.22)", color: "var(--coral)", fontSize: 12, lineHeight: 1.45 }}>
            {error}
          </div>
        ) : null}

        {!error && loading ? (
          <div style={{ textAlign: "center", padding: "28px 16px", color: "var(--ink-3)", fontSize: 13 }}>Carregando…</div>
        ) : null}

        {!error && !loading && listTab === "friends" ? (
          filteredFriends.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-3)", fontSize: 13 }}>
              {friends.length === 0 ? "Nenhum amigo ainda." : "Nenhum amigo encontrado."}
            </div>
          ) : (
            filteredFriends.map((friend) => <FriendRow key={friend.id || friend.email} friend={friend} />)
          )
        ) : null}

        {!error && !loading && listTab === "pending" ? (
          recebidos.length === 0 && enviados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-3)", fontSize: 13 }}>
              Nenhum convite pendente.
            </div>
          ) : (
            <>
              {recebidos.length > 0 ? (
                <>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                      padding: "4px 6px 0",
                    }}
                  >
                    Recebidos
                  </div>
                  {recebidos.map((inv) => (
                    <InviteReceivedRow
                      key={inv.id}
                      invite={inv}
                      busy={actionBusy}
                      onAceitar={handleAceitar}
                      onRecusar={handleRecusarOuCancelar}
                    />
                  ))}
                </>
              ) : null}
              {enviados.length > 0 ? (
                <>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                      padding: recebidos.length > 0 ? "10px 6px 0" : "4px 6px 0",
                    }}
                  >
                    Enviados
                  </div>
                  {enviados.map((inv) => (
                    <InviteSentRow
                      key={inv.id}
                      invite={inv}
                      busy={actionBusy}
                      onCancelar={handleRecusarOuCancelar}
                    />
                  ))}
                </>
              ) : null}
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
