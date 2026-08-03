import LoginForm from './LoginForm'
import Lightfall from '@/components/effects/Lightfall'
import Logo from '@/components/ui/Logo'
import RotatingTagline from '@/components/ui/RotatingTagline'
import { Building2, DoorOpen, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#050810' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Lightfall
          colors={['#FBBF24', '#D97706', '#9A3412']}
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

      {/* Ambient floating accents, echoing the reference hero's corner icon motifs */}
      <div style={{ position: 'absolute', top: '14%', right: '8%', opacity: 0.12, animation: 'floatSlow 7s ease-in-out infinite', pointerEvents: 'none' }}>
        <Building2 size={72} color="#F59E0B" />
      </div>
      <div style={{ position: 'absolute', bottom: '16%', left: '7%', opacity: 0.1, animation: 'floatSlow 8.5s ease-in-out infinite reverse', pointerEvents: 'none' }}>
        <DoorOpen size={56} color="#F59E0B" />
      </div>
      <div style={{ position: 'absolute', top: '22%', left: '10%', opacity: 0.1, animation: 'floatSlow 6s ease-in-out infinite', pointerEvents: 'none' }}>
        <ShieldCheck size={44} color="#FBBF24" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 24px rgba(217,119,6,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Logo size={38} /></div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>Corridor Hill</h1>
            <RotatingTagline lines={[
              'Residence Management Portal · eMalahleni',
              'Applications, Rooms & Biometrics — One Portal',
              'Built for Modern Student Housing',
            ]} />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
