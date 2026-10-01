import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Clock, MapPin, User } from 'lucide-react'
import { obtenirDetailEvenement } from '@/services/evenements'
import { formaterDate, libelleTypeEvenement } from '@/lib/formatage'
import { BadgeStatut } from '@/components/badge-statut'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ProprietesDetailEvenement = {
  idEvenement: string
}

// Affiche le détail d’un événement en lecture seule.
export function DetailEvenement({ idEvenement }: ProprietesDetailEvenement) {
  const requete = useQuery({
    queryKey: ['evenement', idEvenement],
    queryFn: () => obtenirDetailEvenement(idEvenement),
  })

  const detail = requete.data
  const evenement = detail?.evenement

  const titrePage = evenement?.nom_evenement ?? 'Événement'

  return (
    <>
      <Header
        titre={titrePage}
        actions={
          <Button variant='outline' className='min-h-11' asChild>
            <Link to='/evenements'>
              <ArrowLeft className='size-4' aria-hidden />
              <span className='hidden sm:inline'>Retour</span>
            </Link>
          </Button>
        }
      >
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger cet événement.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!requete.isLoading && !requete.isError && detail === null ? (
          <EtatVide
            titre='Événement introuvable'
            description='Cet identifiant ne correspond à aucun événement.'
            action={
              <Button variant='outline' className='min-h-11' asChild>
                <Link to='/evenements'>Retour aux événements</Link>
              </Button>
            }
          />
        ) : null}

        {!requete.isLoading && !requete.isError && detail && evenement ? (
          <div className='space-y-6'>
            <Card className='shadow-xs'>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Créé le {formaterDate(evenement.date_creation)}
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>Nom</p>
                  <p className='font-medium'>{evenement.nom_evenement}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>Type</p>
                  <p>{libelleTypeEvenement(evenement.type_evenement)}</p>
                </div>
                <div className='flex items-start gap-2'>
                  <CalendarDays className='mt-0.5 size-4 text-primary' aria-hidden />
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Date</p>
                    <p>{formaterDate(evenement.date_evenement)}</p>
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <Clock className='mt-0.5 size-4 text-primary' aria-hidden />
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Heure</p>
                    <p>{evenement.heure_evenement}</p>
                  </div>
                </div>
                <div className='flex items-start gap-2 sm:col-span-2'>
                  <MapPin className='mt-0.5 size-4 text-primary' aria-hidden />
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Lieu</p>
                    <p>{evenement.lieu}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='shadow-xs'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='size-5 text-primary' aria-hidden />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail.proprietaire ? (
                  <div className='space-y-1'>
                    <p className='font-medium'>
                      {detail.proprietaire.prenom} {detail.proprietaire.nom}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.proprietaire.email}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.proprietaire.telephone}
                    </p>
                    <div className='pt-2'>
                      <BadgeStatut
                        variante={detail.proprietaire.actif ? 'actif' : 'inactif'}
                      />
                    </div>
                  </div>
                ) : (
                  <EtatVide titre='Propriétaire non renseigné' />
                )}
              </CardContent>
            </Card>

            <Card className='shadow-xs'>
              <CardHeader>
                <CardTitle>Utilisateurs affectés</CardTitle>
                <CardDescription>Rôles sur cet événement</CardDescription>
              </CardHeader>
              <CardContent className='min-w-0'>
                {detail.utilisateurs_affectes.length === 0 ? (
                  <EtatVide titre='Aucun utilisateur affecté' />
                ) : (
                  <div className='-mx-2 overflow-x-auto sm:mx-0'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead className='whitespace-nowrap'>
                            Date d’affectation
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.utilisateurs_affectes.map((affectation) => (
                          <TableRow key={affectation.id_utilisateur_evenement}>
                            <TableCell className='font-medium'>
                              {affectation.utilisateur
                                ? `${affectation.utilisateur.prenom} ${affectation.utilisateur.nom}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {affectation.utilisateur?.email ?? '—'}
                            </TableCell>
                            <TableCell>
                              <BadgeStatut
                                variante='info'
                                libelle={affectation.role_evenement}
                              />
                            </TableCell>
                            <TableCell className='whitespace-nowrap'>
                              {formaterDate(affectation.date_affectation)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </Main>
    </>
  )
}
