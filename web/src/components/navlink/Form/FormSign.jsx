export default function FormSign({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(8,12,28,0.55)',
      backdropFilter: 'blur(3px)',
      WebkitBackdropFilter: 'blur(3px)',
      zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40,
    }}>
      {children}
    </div>
  );
}
