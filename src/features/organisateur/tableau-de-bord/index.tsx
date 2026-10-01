import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react'
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
import { useAuthentification } from '@/hooks/use-authentification'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { obtenirStatistiquesOrganisateur } from '@/services/statistiques-organisateur'
import { formaterDate } from '@/lib/formatage'
import { CarteStatistique } from '@/components/carte-statistique'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useEcran } from '@/hooks/use-ecran'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { memoire } from '@/services/memoire'

/** Page tableau de bord organisateur. */
export function TableauDeBordOrganisateur() {
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const { definirEvenementActif } = useEvenementActif()
  const navigate = useNavigate()
  const { estMobile } = useEcran()

  const statistiques = useQuery({
    queryKey: ['stats-organisateur', utilisateur?.id_utilisateur],
    queryFn: () =>
      obtenirStatistiquesOrganisateur(utilisateur!.id_utilisateur),
    enabled: Boolean(utilisateur),
  })

  // Ouvre un événement et navigue vers les invités.
  const ouvrirEvenement = (idEvenement: string) => {
    const evt = memoire.evenements.find((e) => e.id_evenement === idEvenement)
    if (!evt) return
    definirEvenementActif(evt)
    void navigate({ to: '/organisateur/invites' })
  }

  return (
    <>
      <EnTeteOrganisateur
        titre='Tableau de bord'
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
            message='Impossible de charger le tableau de bord'
            onReessayer={() => void statistiques.refetch()}
          />
        ) : null}
        {statistiques.data ? (
          <>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <CarteStatistique
                titre='Événements'
                valeur={statistiques.data.nombre_evenements}
                icone={CalendarDays}
              />
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
                icone={UserX}
              />
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Événements à venir</CardTitle>
                  <CardDescription>
                    Accès rapide — ouvre l’événement actif
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statistiques.data.evenements_a_venir.length === 0 ? (
                    <EtatVide
                      titre='Aucun événement à venir'
                      description='Créez un événement pour commencer.'
                      action={
                        <Button asChild>
                          <Link to='/organisateur/evenements'>
                            Mes événements
                          </Link>
                        </Button>
                      }
                    />
                  ) : (
                    <ul className='flex flex-col gap-2'>
                      {statistiques.data.evenements_a_venir.map((evt) => (
                        <li key={evt.id_evenement}>
                          <button
                            type='button'
                            onClick={() => ouvrirEvenement(evt.id_evenement)}
                            className='flex min-h-11 w-full flex-col rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors duration-150 hover:bg-accent'
                          >
                            <span className='font-medium text-foreground'>
                              {evt.nom_evenement}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {formaterDate(evt.date_evenement)} ·{' '}
                              {evt.heure_evenement} · {evt.lieu}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Présences</CardTitle>
                  <CardDescription>Répartition par événement</CardDescription>
                </CardHeader>
                <CardContent className='h-64'>
                  {statistiques.data.presence_par_evenement.length === 0 ? (
                    <EtatVide titre='Pas encore de données' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={statistiques.data.presence_par_evenement}>
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-border'
                        />
                        <XAxis dataKey='nom' tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey='presents'
                          name='Présents'
                          fill='var(--chart-2)'
                          radius={4}
                        />
                        <Bar
                          dataKey='absents'
                          name='Absents'
                          fill='var(--chart-4)'
                          radius={4}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
