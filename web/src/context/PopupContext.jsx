import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Popups from '../components/Popups/Popups.jsx';

const PopupContext = createContext(null);

const AUTO_DISMISS = { login: 3800, location: 5200, error: 4800 };

export function PopupProvider({ children }) {
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState('idle');
  const autoTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const keyRef = useRef(0);

  const hide = useCallback(() => {
    clearTimeout(autoTimerRef.current);
    setPhase('hiding');
    hideTimerRef.current = setTimeout(() => {
      setActive(null);
      setPhase('idle');
    }, 320);
  }, []);

  const showPopup = useCallback((type, data = {}) => {
    clearTimeout(autoTimerRef.current);
    clearTimeout(hideTimerRef.current);

    setActive({ type, data, key: ++keyRef.current });
    setPhase('show');

    const delay = AUTO_DISMISS[type];
    if (delay) {
      autoTimerRef.current = setTimeout(hide, delay);
    }
  }, [hide]);

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup: hide }}>
      {children}
      <Popups active={active} phase={phase} onHide={hide} />
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup deve ser usado dentro de PopupProvider');
  return ctx;
}
