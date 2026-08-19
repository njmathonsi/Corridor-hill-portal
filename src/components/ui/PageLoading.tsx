import Logo from './Logo'

export default function PageLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="page-loading-pulse">
        <Logo size={36} />
      </div>
    </div>
  )
}
