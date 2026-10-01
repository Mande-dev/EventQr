import { useEcran } from '@/hooks/use-ecran'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type ColonneListe<T> = {
  cle: string
  libelle: string
  cellule: (ligne: T) => React.ReactNode
  classeEntete?: string
  classeCellule?: string
  masqueeMobile?: boolean
}

type ProprietesListeAdaptative<T> = {
  donnees: T[]
  colonnes: ColonneListe<T>[]
  cleLigne: (ligne: T) => string
  renduCarte: (ligne: T) => React.ReactNode
  className?: string
  onLigneClic?: (ligne: T) => void
}

/**
 * Liste adaptative : cartes tactiles sur mobile, tableau sur bureau.
 */
export function ListeAdaptative<T>({
  donnees,
  colonnes,
  cleLigne,
  renduCarte,
  className,
  onLigneClic,
}: ProprietesListeAdaptative<T>) {
  const { estMobile } = useEcran()

  if (estMobile) {
    return (
      <ul className={cn('flex flex-col gap-3', className)}>
        {donnees.map((ligne) => (
          <li key={cleLigne(ligne)}>{renduCarte(ligne)}</li>
        ))}
      </ul>
    )
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {colonnes
              .filter((c) => !c.masqueeMobile)
              .map((colonne) => (
                <TableHead key={colonne.cle} className={colonne.classeEntete}>
                  {colonne.libelle}
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {donnees.map((ligne) => (
            <TableRow
              key={cleLigne(ligne)}
              className={onLigneClic ? 'cursor-pointer' : undefined}
              onClick={onLigneClic ? () => onLigneClic(ligne) : undefined}
            >
              {colonnes
                .filter((c) => !c.masqueeMobile)
                .map((colonne) => (
                  <TableCell key={colonne.cle} className={colonne.classeCellule}>
                    {colonne.cellule(ligne)}
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
