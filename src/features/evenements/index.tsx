import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import { listerEvenements } from '@/services/evenements'
import type { Evenement, TypeEvenement } from '@/types'
import { formaterDate, libelleTypeEvenement } from '@/lib/formatage'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TYPES_FILTRE: TypeEvenement[] = ['mariage', 'anniversaire']

type FiltresEvenements = {
  recherche: string
  type: TypeEvenement | 'tous'
  date: string
}

// Filtre les événements selon la recherche, le type et la date.
const filtrerEvenements = (
  liste: Evenement[],
  filtres: FiltresEvenements
): Evenement[] => {
  const terme = filtres.recherche.trim().toLowerCase()
  return liste.filter((evenement) => {
    if (filtres.type !== 'tous' && evenement.type_evenement !== filtres.type) {
      return false
    }
    if (filtres.date && evenement.date_evenement !== filtres.date) {
      return false
    }
    if (!terme) return true
    const nom = evenement.nom_evenement.toLowerCase()
    const lieu = evenement.lieu.toLowerCase()
    const type = libelleTypeEvenement(evenement.type_evenement).toLowerCase()
    return nom.includes(terme) || lieu.includes(terme) || type.includes(terme)
  })
}

// Page liste des événements (consultation seule).
export function Evenements() {
  const [recherche, setRecherche] = useState('')
  const [typeFiltre, setTypeFiltre] = useState<TypeEvenement | 'tous'>('tous')
  const [dateFiltre, setDateFiltre] = useState('')

  const requete = useQuery({
    queryKey: ['evenements'],
    queryFn: listerEvenements,
  })

  const evenementsFiltres = useMemo(() => {
    if (!requete.data) return []
    return filtrerEvenements(requete.data, {
      recherche,
      type: typeFiltre,
      date: dateFiltre,
    })
  }, [requete.data, recherche, typeFiltre, dateFiltre])

  const evenementsTries = useMemo(
    () =>
      [...evenementsFiltres].sort(
        (a, b) =>
          new Date(b.date_evenement).getTime() -
          new Date(a.date_evenement).getTime()
      ),
    [evenementsFiltres]
  )

  return (
    <>
      <Header titre='Événements'>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger les événements.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!requete.isLoading && !requete.isError && requete.data ? (
          <div className='space-y-6'>
            <Card className='border-border/80 shadow-none'>
              <CardHeader>
                <CardTitle>Recherche et filtres</CardTitle>
                <CardDescription>
                  Filtrez par nom, lieu, type ou date de l’événement.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='space-y-2 sm:col-span-2 lg:col-span-1'>
                  <Label htmlFor='recherche-evenements'>Recherche</Label>
                  <div className='relative'>
                    <Search
                      className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
                      aria-hidden
                    />
                    <Input
                      id='recherche-evenements'
                      type='search'
                      placeholder='Nom, lieu ou type…'
                      value={recherche}
                      onChange={(event) => setRecherche(event.target.value)}
                      className='min-h-11 ps-9'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='filtre-type-evenement'>Type</Label>
                  <Select
                    value={typeFiltre}
                    onValueChange={(valeur) =>
                      setTypeFiltre(valeur as TypeEvenement | 'tous')
                    }
                  >
                    <SelectTrigger
                      id='filtre-type-evenement'
                      className='min-h-11 w-full'
                    >
                      <SelectValue placeholder='Tous les types' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='tous'>Tous les types</SelectItem>
                      {TYPES_FILTRE.map((type) => (
                        <SelectItem key={type} value={type}>
                          {libelleTypeEvenement(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='filtre-date-evenement'>Date</Label>
                  <Input
                    id='filtre-date-evenement'
                    type='date'
                    value={dateFiltre}
                    onChange={(event) => setDateFiltre(event.target.value)}
                    className='min-h-11'
                  />
                </div>
              </CardContent>
            </Card>

            {evenementsTries.length === 0 ? (
              <EtatVide
                titre='Aucun événement trouvé'
                description='Modifiez la recherche ou les filtres pour afficher d’autres résultats.'
              />
            ) : (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {evenementsTries.map((evenement) => (
                  <Link
                    key={evenement.id_evenement}
                    to='/evenements/$idEvenement'
                    params={{ idEvenement: evenement.id_evenement }}
                    className='min-h-11 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  >
                    <Card className='h-full shadow-xs transition-colors hover:bg-accent'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='line-clamp-2 text-base'>
                          {evenement.nom_evenement}
                        </CardTitle>
                        <CardDescription>
                          {libelleTypeEvenement(evenement.type_evenement)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-2 text-sm text-muted-foreground'>
                        <p className='flex items-center gap-2'>
                          <CalendarDays className='size-4 shrink-0 text-primary' aria-hidden />
                          <span>
                            {formaterDate(evenement.date_evenement)} ·{' '}
                            {evenement.heure_evenement}
                          </span>
                        </p>
                        <p className='flex items-start gap-2'>
                          <MapPin className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden />
                          <span className='line-clamp-2'>{evenement.lieu}</span>
                        </p>
                        <p className='text-xs text-lien'>Voir le détail</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Main>
    </>
  )
}
