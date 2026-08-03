import LoginForm from './LoginForm'
import Lightfall from '@/components/effects/Lightfall'
import Logo from '@/components/ui/Logo'

export default function LoginPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#050810' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Lightfall
          colors={['#A78BFA', '#6C2BD9', '#2E4FCC']}
          backgroundColor="#1B2A6B"
          speed={0.6}
          streakCount={10}
          streakWidth={1.1}
          streakLength={1.3}
          glow={1.1}
          density={0.8}
          twinkle={1}
          zoom={2.6}
          backgroundGlow={0.7}
          opacity={0.9}
          mouseInteraction
          mouseStrength={0.6}
          mouseRadius={0.8}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 24px rgba(108,43,217,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Logo size={38} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</h1>
            <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>Residence Management Portal · eMalahleni</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
