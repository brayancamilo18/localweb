export function PublicPageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)' }}>
      <div className="lw-shimmer" style={{ height: 56, marginBottom: 0 }} />
      <div style={{ padding: 24 }}>
        <div className="lw-shimmer" style={{ height: 320, borderRadius: 12, marginBottom: 20 }} />
        <div className="lw-shimmer" style={{ height: 20, borderRadius: 4, maxWidth: '50%', marginBottom: 12 }} />
        <div className="lw-shimmer" style={{ height: 14, borderRadius: 4, maxWidth: '80%' }} />
      </div>
    </div>
  )
}
