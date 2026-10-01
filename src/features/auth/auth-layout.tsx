import { Logo } from '@/assets/logo'

type ProprietesAuthLayout = {
  children: React.ReactNode
}

// Disposition centrée pour les pages d'authentification EventQR.
export function AuthLayout({ children }: ProprietesAuthLayout) {
  return (
    <div className='relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10'>
      <div
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--eventqr-principal)_12%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,var(--eventqr-accent)_10%,transparent),_transparent_50%)]'
        aria-hidden
      />
      <div className='relative z-10 mx-auto flex w-full max-w-md flex-col gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <Logo variante='complet' className='h-12 w-auto max-w-[220px]' />
          <p className='text-sm text-muted-foreground'>
            Plateforme de gestion d’événements à QR code
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
