import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Table2,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { obtenirStatistiquesEvenement } from '@/services/statistiques-organisateur'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { CarteStatistique } from '@/components/carte-statistique'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEcran } from '@/hooks/use-ecran'

/** Page statistiques détaillées de l'événement actif. */
export function PageStatistiquesOrganisateur() {
  const { evenementActif } = useEvenementActif()
  const { estMobile } = useEcran()
  const idEvenement = evenementActif?.id_evenement ?? ''

  const statistiques = useQuery({
    queryKey: ['stats-evenement', idEvenement],
    queryFn: () => obtenirStatistiquesEvenement(idEvenement),
    enabled: Boolean(idEvenement),
  })

  return (
    <GardeEvenementActif>
      <EnTeteOrganisateur
        titre='Statistiques'
        actions={
          !estMobile ? (
            <>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />
      <div className='flex flex-col gap-6 px-4 py-4 sm:px-6'>
        {statistiques.isLoading ? <SquelettePage /> : null}
        {statistiques.isError ? (
          <EtatErreur
            message='Impossible de charger les statistiques'
            onReessayer={() => void statistiques.refetch()}
          />
        ) : null}

        {statistiques.data ? (
          <>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <CarteStatistique
                titre='Invités'
                valeur={statistiques.data.total_invites}
                icone={Users}
              />
              <CarteStatistique
                titre='Présents'
                valeur={statistiques.data.presents}
                icone={UserCheck}
              />
              <CarteStatistique
                titre='Absents'
                valeur={statistiques.data.absents}
                icone={UserMinus}
              />
              <CarteStatistique
                titre='Tables'
                valeur={statistiques.data.total_tables}
                icone={Table2}
                description={`${statistiques.data.places_occupees} / ${statistiques.data.places_totales} places`}
              />
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <CarteStatistique
                titre='Invités affectés'
                valeur={statistiques.data.affectes}
              />
              <CarteStatistique
                titre='Non affectés'
                valeur={statistiques.data.non_affectes}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Occupation des tables</CardTitle>
                <CardDescription>
                  Places occupées par rapport à la capacité de chaque table
                </CardDescription>
              </CardHeader>
              <CardContent className='h-72 sm:h-80'>
                {statistiques.data.occupation_tables.length === 0 ? (
                  <EtatVide titre='Aucune table configurée' />
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={statistiques.data.occupation_tables}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-border'
                      />
                      <XAxis
                        dataKey='libelle'
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-25}
                        textAnchor='end'
                        height={60}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          value,
                          name === 'occupees' ? 'Occupées' : 'Capacité',
                        ]}
                        labelFormatter={(label) => String(label)}
                      />
                      <Legend />
                      <Bar
                        dataKey='capacite'
                        name='Capacité'
                        fill='var(--chart-3)'
                        radius={4}
                      />
                      <Bar
                        dataKey='occupees'
                        name='Occupées'
                        fill='var(--chart-1)'
                        radius={4}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </GardeEvenementActif>
  )
}
