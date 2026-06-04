interface Props {
  onReset: () => void
}

export default function DevPanel({ onReset }: Props) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}>
      <button
        onClick={onReset}
        style={{
          background: '#1a0a0a',
          border: '1px solid #5a2020',
          borderRadius: '10px',
          color: '#805050',
          fontFamily: 'Cinzel',
          fontSize: '11px',
          letterSpacing: '0.05em',
          padding: '8px 12px',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        DEV RESET
      </button>
    </div>
  )
}
