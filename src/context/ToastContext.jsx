import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ToastStack from '../components/Toast/ToastStack.jsx';

const ToastContext = createContext(null);

const DISMISS_DELAY = 4200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, message, options = {}) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, message, ...options }]);
    setTimeout(() => dismiss(id), DISMISS_DELAY);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
