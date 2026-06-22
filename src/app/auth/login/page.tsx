import LoginForm from './LoginForm'
export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#09090b' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>CH</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</h1>
          <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>Residence Management Portal · eMalahleni</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
