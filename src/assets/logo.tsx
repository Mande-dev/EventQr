import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

type VarianteLogo = 'complet' | 'icone'

type ProprietesLogo = SVGProps<SVGSVGElement> & {
  variante?: VarianteLogo
  /** Texte clair pour fond sombre (sidebar). */
  surFondSombre?: boolean
}

/**
 * Logo EventQR — fidèle à logosvg.svg à la racine du projet.
 */
export function Logo({
  className,
  variante = 'complet',
  surFondSombre = false,
  ...props
}: ProprietesLogo) {
  const estIcone = variante === 'icone'
  const idDegrade = useId().replace(/:/g, '')
  const couleurEvent = surFondSombre ? '#FFFFFF' : '#07385B'
  const couleurQ = surFondSombre ? '#7EC8E8' : '#1A6FA0'
  const couleurR = '#10B981'

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={estIcone ? '20 15 175 180' : '0 0 800 220'}
      fill='none'
      className={cn(
        estIcone ? 'size-9 shrink-0' : 'h-10 w-auto max-w-[180px] shrink-0',
        className
      )}
      aria-label='EventQR'
      role='img'
      {...props}
    >
      <title>EventQR</title>
      <defs>
        <linearGradient
          id={`eventqr-${idDegrade}`}
          x1='0%'
          y1='0%'
          x2='100%'
          y2='100%'
        >
          <stop offset='0%' stopColor='#0A4B7A' />
          <stop offset='55%' stopColor='#1A6FA0' />
          <stop offset='100%' stopColor='#10B981' />
        </linearGradient>
      </defs>

      {/* Icône — même structure que logosvg.svg */}
      <g transform='translate(25 20)'>
        <rect
          x='20'
          y='20'
          width='125'
          height='145'
          rx='24'
          transform='rotate(-10 82 92)'
          fill={`url(#eventqr-${idDegrade})`}
        />

        <g fill='#FFFFFF'>
          <rect x='48' y='55' width='32' height='32' rx='4' />
          <rect x='55' y='62' width='18' height='18' fill='#0A4B7A' />

          <rect x='91' y='55' width='32' height='32' rx='4' />
          <rect x='98' y='62' width='18' height='18' fill='#1A6FA0' />

          <rect x='48' y='98' width='32' height='32' rx='4' />
          <rect x='55' y='105' width='18' height='18' fill='#0A4B7A' />

          <rect x='94' y='100' width='12' height='12' />
          <rect x='111' y='100' width='12' height='12' />
          <rect x='94' y='117' width='12' height='12' />
          <rect x='111' y='117' width='12' height='12' />
        </g>

        <path
          d='M8 128 C35 185 118 195 160 142'
          fill='none'
          stroke='#10B981'
          strokeWidth='10'
          strokeLinecap='round'
        />
      </g>

      {!estIcone && (
        <text
          x='190'
          y='125'
          fontFamily='Inter, Arial, sans-serif'
          fontSize='72'
          fontWeight='800'
          fill={couleurEvent}
        >
          Event
          <tspan fill={couleurQ}>Q</tspan>
          <tspan fill={couleurR}>R</tspan>
        </text>
      )}
    </svg>
  )
}
