import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Users,
  CalendarDays,
  QrCode,
  Percent,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { obtenirStatistiquesGlobales } from '@/services/statistiques'
import { listerEvenements } from '@/services/evenements'
import { listerUtilisateurs } from '@/services/utilisateurs'
import { formaterDate, libelleTypeEvenement } from '@/lib/formatage'
import { CarteStatistique } from '@/components/carte-statistique'
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
import { BadgeStatut } from '@/components/badge-statut'

// Page tableau de bord du Super Administrateur.
export function TableauDeBord() {
  const statistiques = useQuery({
    queryKey: ['statistiques-globales'],
    queryFn: obtenirStatistiquesGlobales,
  })
  const evenements = useQuery({
    queryKey: ['evenements'],
    queryFn: listerEvenements,
  })
  const utilisateurs = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: listerUtilisateurs,
  })

  const enChargement =
    statistiques.isLoading || evenements.isLoading || utilisateurs.isLoading
  const enErreur =
    statistiques.isError || evenements.isError || utilisateurs.isError

  // Relance les requêtes en erreur.
  const reessayer = () => {
    void statistiques.refetch()
    void evenements.refetch()
    void utilisateurs.refetch()
  }

  const evenementsRecents = [...(evenements.data ?? [])]
    .sort(
      (a, b) =>
        new Date(b.date_creation).getTime() -
        new Date(a.date_creation).getTime()
    )
    .slice(0, 5)

  const utilisateursRecents = [...(utilisateurs.data ?? [])]
    .sort(
      (a, b) =>
        new Date(b.date_creation).getTime() -
        new Date(a.date_creation).getTime()
    )
    .slice(0, 5)

  return (
    <>
      <Header titre='Tableau de bord'>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {enChargement ? <SquelettePage /> : null}
        {enErreur ? (
          <EtatErreur
            message='Impossible de charger le tableau de bord.'
            onReessayer={reessayer}
          />
        ) : null}

        {!enChargement && !enErreur && statistiques.data ? (
          <div className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              <CarteStatistique
                titre='Utilisateurs'
                valeur={statistiques.data.nombre_utilisateurs}
                description='Comptes enregistrés'
                icone={Users}
              />
              <CarteStatistique
                titre='Événements'
                valeur={statistiques.data.nombre_evenements}
                description='Événements créés'
                icone={CalendarDays}
              />
              <CarteStatistique
                titre='Invités'
                valeur={statistiques.data.total_invites}
                description='Invitations générées'
                icone={QrCode}
              />
              <CarteStatistique
                titre='Taux de présence'
                valeur={`${statistiques.data.taux_presence} %`}
                description={`${statistiques.data.invites_presents} présents`}
                icone={Percent}
              />
            </div>

            <Card className='border-border/80 shadow-none'>
              <CardHeader>
                <CardTitle>Évolution</CardTitle>
                <CardDescription>
                  Événements et invités par mois
                </CardDescription>
              </CardHeader>
              <CardContent className='h-72 w-full min-w-0'>
                {statistiques.data.evolution_mensuelle.length === 0 ? (
                  <EtatVide titre='Aucune donnée d’évolution' />
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={statistiques.data.evolution_mensuelle}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                      <XAxis dataKey='mois' tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={32} />
                      <Tooltip />
                      <Area
                        type='monotone'
                        dataKey='evenements'
                        name='Événements'
                        stroke='var(--chart-1)'
                        fill='var(--chart-1)'
                        fillOpacity={0.15}
                      />
                      <Area
                        type='monotone'
                        dataKey='invites'
                        name='Invités'
                        stroke='var(--chart-2)'
                        fill='var(--chart-2)'
                        fillOpacity={0.15}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className='grid gap-4 lg:grid-cols-2'>
              <Card className='border-border/80 shadow-none'>
                <CardHeader>
                  <CardTitle>Événements récents</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {evenementsRecents.length === 0 ? (
                    <EtatVide titre='Aucun événement' />
                  ) : (
                    evenementsRecents.map((evenement) => (
                      <Link
                        key={evenement.id_evenement}
                        to='/evenements/$idEvenement'
                        params={{ idEvenement: evenement.id_evenement }}
                        className='flex min-h-11 flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>{evenement.nom_evenement}</p>
                          <p className='text-xs text-muted-foreground'>
                            {libelleTypeEvenement(evenement.type_evenement)} ·{' '}
                            {formaterDate(evenement.date_evenement)}
                          </p>
                        </div>
                        <span className='text-xs text-lien'>Voir</span>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className='border-border/80 shadow-none'>
                <CardHeader>
                  <CardTitle>Utilisateurs récents</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {utilisateursRecents.length === 0 ? (
                    <EtatVide titre='Aucun utilisateur' />
                  ) : (
                    utilisateursRecents.map((utilisateur) => (
                      <Link
                        key={utilisateur.id_utilisateur}
                        to='/utilisateurs/$idUtilisateur'
                        params={{ idUtilisateur: utilisateur.id_utilisateur }}
                        className='flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent'
                      >
                        <div>
                          <p className='font-medium'>
                            {utilisateur.prenom} {utilisateur.nom}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {utilisateur.email}
                          </p>
                        </div>
                        <BadgeStatut
                          variante={utilisateur.actif ? 'actif' : 'inactif'}
                        />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </Main>
    </>
  )
}
