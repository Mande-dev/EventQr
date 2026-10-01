import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  CalendarDays,
  QrCode,
  Percent,
  UserCheck,
  UserX,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { obtenirStatistiquesGlobales } from '@/services/statistiques'
import { libelleTypeEvenement } from '@/lib/formatage'
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

const COULEURS_GRAPHIQUE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

// Prépare les données du graphique en barres par type d’événement.
const preparerDonneesBarres = (
  entrees: { type: string; nombre: number }[]
): { libelle: string; nombre: number }[] =>
  entrees.map((item) => ({
    libelle: libelleTypeEvenement(item.type),
    nombre: item.nombre,
  }))

// Prépare les parts présents / absents pour le graphique circulaire.
const preparerDonneesPresence = (
  presents: number,
  absents: number
): { nom: string; valeur: number }[] => [
  { nom: 'Présents', valeur: presents },
  { nom: 'Absents', valeur: absents },
]

// Page statistiques globales de la plateforme.
export function Statistiques() {
  const requete = useQuery({
    queryKey: ['statistiques-globales'],
    queryFn: obtenirStatistiquesGlobales,
  })

  const donneesBarres = useMemo(
    () => preparerDonneesBarres(requete.data?.evenements_par_type ?? []),
    [requete.data?.evenements_par_type]
  )

  const donneesPresence = useMemo(
    () =>
      preparerDonneesPresence(
        requete.data?.invites_presents ?? 0,
        requete.data?.invites_absents ?? 0
      ),
    [requete.data?.invites_absents, requete.data?.invites_presents]
  )

  const totalPresence = donneesPresence.reduce(
    (acc, item) => acc + item.valeur,
    0
  )

  return (
    <>
      <Header titre='Statistiques'>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger les statistiques.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!requete.isLoading && !requete.isError && requete.data ? (
          <div className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              <CarteStatistique
                titre='Utilisateurs'
                valeur={requete.data.nombre_utilisateurs}
                description='Comptes enregistrés'
                icone={Users}
              />
              <CarteStatistique
                titre='Événements'
                valeur={requete.data.nombre_evenements}
                description='Événements créés'
                icone={CalendarDays}
              />
              <CarteStatistique
                titre='Invités'
                valeur={requete.data.total_invites}
                description='Invitations générées'
                icone={QrCode}
              />
              <CarteStatistique
                titre='Taux de présence'
                valeur={`${requete.data.taux_presence} %`}
                description={`${requete.data.invites_presents} présents`}
                icone={Percent}
              />
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              <Card className='shadow-xs'>
                <CardHeader>
                  <CardTitle>Événements par type</CardTitle>
                  <CardDescription>Répartition par catégorie</CardDescription>
                </CardHeader>
                <CardContent className='h-72 w-full min-w-0'>
                  {donneesBarres.length === 0 ? (
                    <EtatVide titre='Aucun événement par type' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={donneesBarres}>
                        <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                        <XAxis
                          dataKey='libelle'
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor='end'
                          height={56}
                        />
                        <YAxis tickLine={false} axisLine={false} width={32} />
                        <Tooltip />
                        <Bar
                          dataKey='nombre'
                          name='Événements'
                          fill='var(--chart-1)'
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className='shadow-xs'>
                <CardHeader>
                  <CardTitle>Présence des invités</CardTitle>
                  <CardDescription>Présents et absents</CardDescription>
                </CardHeader>
                <CardContent className='h-72 w-full min-w-0'>
                  {totalPresence === 0 ? (
                    <EtatVide titre='Aucune donnée de présence' />
                  ) : (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Tooltip />
                        <Pie
                          data={donneesPresence}
                          dataKey='valeur'
                          nameKey='nom'
                          cx='50%'
                          cy='50%'
                          innerRadius={48}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {donneesPresence.map((_, index) => (
                            <Cell
                              key={donneesPresence[index].nom}
                              fill={
                                COULEURS_GRAPHIQUE[
                                  index % COULEURS_GRAPHIQUE.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <CarteStatistique
                titre='Invités présents'
                valeur={requete.data.invites_presents}
                description='Scans validés'
                icone={UserCheck}
              />
              <CarteStatistique
                titre='Invités absents'
                valeur={requete.data.invites_absents}
                description='Non présents ou en attente'
                icone={UserX}
              />
            </div>

            <Card className='shadow-xs'>
              <CardHeader>
                <CardTitle>Évolution mensuelle</CardTitle>
                <CardDescription>Événements et invités par mois</CardDescription>
              </CardHeader>
              <CardContent className='h-72 w-full min-w-0'>
                {requete.data.evolution_mensuelle.length === 0 ? (
                  <EtatVide titre='Aucune donnée d’évolution' />
                ) : (
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={requete.data.evolution_mensuelle}>
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
          </div>
        ) : null}
      </Main>
    </>
  )
}
