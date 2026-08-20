import LoginForm from './LoginForm'
import Lightfall from '@/components/effects/Lightfall'
import LogoLockup from '@/components/ui/LogoLockup'
import RotatingTagline from '@/components/ui/RotatingTagline'
import { Building2, DoorOpen, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#050810' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Lightfall
          // Literal hex, not the brand tokens: Lightfall feeds these straight
          // into a WebGL shader, which cannot resolve var(). Mirrors
          // --brand-hi / --brand-mid / --brand-deepest — retune together.
          colors={['#A5B4FC', '#6366F1', '#3730A3']}
          backgroundColor="#1E1B4B"
          speed={0.45}
          streakCount={6}
          streakWidth={1.1}
          streakLength={1.3}
          glow={0.75}
          density={0.45}
          twinkle={1}
          zoom={2.6}
          backgroundGlow={0.4}
          opacity={0.5}
          mouseInteraction
          mouseStrength={0.6}
          mouseRadius={0.8}
        />
      </div>

      {/* Ambient floating accents, echoing the reference hero's corner icon motifs */}
      <div style={{ position: 'absolute', top: '14%', right: '8%', opacity: 0.12, animation: 'floatSlow 7s ease-in-out infinite', pointerEvents: 'none' }}>
        <Building2 size={72} color="var(--brand)" />
      </div>
      <div style={{ position: 'absolute', bottom: '16%', left: '7%', opacity: 0.1, animation: 'floatSlow 8.5s ease-in-out infinite reverse', pointerEvents: 'none' }}>
        <DoorOpen size={56} color="var(--brand)" />
      </div>
      <div style={{ position: 'absolute', top: '22%', left: '10%', opacity: 0.1, animation: 'floatSlow 6s ease-in-out infinite', pointerEvents: 'none' }}>
        <ShieldCheck size={44} color="var(--brand-hi)" />
      </div>

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(9,9,20,0.82) 0%, rgba(9,9,20,0.55) 45%, rgba(9,9,20,0) 78%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {/* The mark carries its own glow now that the tile is gone — the
                "Stack" lockup reads as one column, so a container around just
                the mark would break the vertical rhythm. */}
            <div style={{ filter: 'drop-shadow(0 0 22px rgb(var(--brand-mid-rgb) / 0.45))', marginBottom: 16 }}>
              <LogoLockup markSize={46} animated />
            </div>
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
