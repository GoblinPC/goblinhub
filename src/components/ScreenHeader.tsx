interface Props {
  icon: string
  title: string
  subtitle?: string
  onBack: () => void
}

export default function ScreenHeader({ icon, title, subtitle, onBack }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px 16px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'rgba(255,200,80,0.06)',
          border: '1px solid #3d2e1e',
          borderRadius: '10px',
          color: '#8a6840',
          fontFamily: 'Cinzel',
          fontSize: '16px',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          touchAction: 'manipulation',
        }}
      >
        ←
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px', lineHeight: 1 }}>{icon}</span>
          <h2 style={{ fontFamily: 'Cinzel', fontSize: '20px', fontWeight: 700, color: '#f0c060', margin: 0, letterSpacing: '0.04em' }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p style={{ fontFamily: 'Crimson Text', fontSize: '14px', color: '#6a5040', margin: '2px 0 0', fontStyle: 'italic' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
