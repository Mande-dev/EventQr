import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ScanLine, Search } from 'lucide-react'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { listerInvites, simulerScanPresence, type InviteEnrichi } from '@/services/invites'
import { formaterDate, libelleTable } from '@/lib/formatage'
import { afficherErreur, afficherSucces } from '@/lib/alertes'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { ListeAdaptative } from '@/components/liste-adaptative'
import { BadgeStatut } from '@/components/badge-statut'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEcran } from '@/hooks/use-ecran'
import { cn } from '@/lib/utils'

/** Formate date et heure de scan (ISO). */
function formaterDateHeure(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const heures = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formaterDate(iso)} ${heures}:${minutes}`
}

type OngletPresence = 'present' | 'absent'

/** Page suivi des présences par événement. */
export function PagePresences() {
  const { evenementActif } = useEvenementActif()
  const { estMobile } = useEcran()
  const queryClient = useQueryClient()
  const idEvenement = evenementActif?.id_evenement ?? ''

  const [onglet, definirOnglet] = useState<OngletPresence>('present')
  const [recherche, definirRecherche] = useState('')

  const requeteInvites = useQuery({
    queryKey: ['invites', idEvenement],
    queryFn: () => listerInvites(idEvenement),
    enabled: Boolean(idEvenement),
  })

  const invitesFiltres = useMemo(() => {
    const liste = requeteInvites.data ?? []
    const terme = recherche.trim().toLowerCase()
    return liste.filter((inv) => {
      const correspondOnglet =
        onglet === 'present'
          ? inv.statut_presence === 'present'
          : inv.statut_presence !== 'present'
      if (!correspondOnglet) return false
      if (!terme) return true
      return inv.nom_complet.toLowerCase().includes(terme)
    })
  }, [requeteInvites.data, onglet, recherche])

  const mutationScan = useMutation({
    mutationFn: (idInvite: string) => simulerScanPresence(idInvite),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invites', idEvenement] })
      await queryClient.invalidateQueries({
        queryKey: ['stats-evenement', idEvenement],
      })
      await afficherSucces('Présence enregistrée')
    },
    onError: async (erreur) => {
      const message =
        erreur instanceof Error ? erreur.message : 'Simulation impossible.'
      await afficherErreur('Simulation impossible', message)
    },
  })

  // Simule un scan QR (mode développement uniquement).
  const simulerScan = (invite: InviteEnrichi) => {
    if (!import.meta.env.DEV) return
    mutationScan.mutate(invite.id_invite)
  }

  const colonnes = useMemo(
    () => [
      {
        cle: 'invite',
        libelle: 'Invité',
        cellule: (inv: InviteEnrichi) => (
          <span className='font-medium'>{inv.nom_complet}</span>
        ),
      },
      {
        cle: 'statut',
        libelle: 'Statut',
        cellule: (inv: InviteEnrichi) => (
          <BadgeStatut
            variante={
              inv.statut_presence === 'present' ? 'present' : 'absent'
            }
          />
        ),
      },
      {
        cle: 'scan',
        libelle: 'Heure du scan',
        cellule: (inv: InviteEnrichi) => (
          <span className='text-muted-foreground'>
            {formaterDateHeure(inv.date_scan)}
          </span>
        ),
      },
      {
        cle: 'table',
        libelle: 'Table',
        cellule: (inv: InviteEnrichi) =>
          inv.numero_table
            ? libelleTable(inv.numero_table, inv.nom_table)
            : '—',
      },
      ...(import.meta.env.DEV
        ? [
            {
              cle: 'demo',
              libelle: 'Démo',
              cellule: (inv: InviteEnrichi) =>
                inv.statut_presence !== 'present' ? (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='min-h-9'
                    disabled={mutationScan.isPending}
                    onClick={(e) => {
                      e.stopPropagation()
                      simulerScan(inv)
                    }}
                  >
                    {mutationScan.isPending ? (
                      <Loader2 className='size-3 animate-spin' />
                    ) : (
                      <ScanLine className='size-3' />
                    )}
                    Simuler scan
                  </Button>
                ) : (
                  '—'
                ),
            },
          ]
        : []),
    ],
    [mutationScan.isPending]
  )

  // Carte mobile pour un invité.
  const renduCarte = (inv: InviteEnrichi) => (
    <div className='rounded-xl border border-border bg-card p-4 shadow-xs'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='font-semibold text-foreground'>{inv.nom_complet}</p>
          <p className='text-xs text-muted-foreground'>
            Scan : {formaterDateHeure(inv.date_scan)}
          </p>
          <p className='text-xs text-muted-foreground'>
            {inv.numero_table
              ? libelleTable(inv.numero_table, inv.nom_table)
              : 'Non affecté'}
          </p>
        </div>
        <BadgeStatut
          variante={inv.statut_presence === 'present' ? 'present' : 'absent'}
        />
      </div>
      {import.meta.env.DEV && inv.statut_presence !== 'present' ? (
        <Button
          type='button'
          variant='outline'
          className='mt-3 min-h-11 w-full'
          disabled={mutationScan.isPending}
          onClick={() => simulerScan(inv)}
        >
          {mutationScan.isPending ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <ScanLine className='size-4' />
          )}
          Simuler scan (dev)
        </Button>
      ) : null}
    </div>
  )

  const comptePresents =
    requeteInvites.data?.filter((i) => i.statut_presence === 'present')
      .length ?? 0
  const compteAbsents =
    requeteInvites.data?.filter((i) => i.statut_presence !== 'present')
      .length ?? 0

  return (
    <GardeEvenementActif>
      <EnTeteOrganisateur
        titre='Présences'
        actions={
          !estMobile ? (
            <>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />
      <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
        {requeteInvites.isLoading ? <SquelettePage /> : null}
        {requeteInvites.isError ? (
          <EtatErreur
            message='Impossible de charger les présences'
            onReessayer={() => void requeteInvites.refetch()}
          />
        ) : null}

        {requeteInvites.data ? (
          <>
            <Tabs
              value={onglet}
              onValueChange={(v) => definirOnglet(v as OngletPresence)}
            >
              <TabsList className='grid w-full max-w-md grid-cols-2'>
                <TabsTrigger value='present' className='min-h-11'>
                  Présents ({comptePresents})
                </TabsTrigger>
                <TabsTrigger value='absent' className='min-h-11'>
                  Absents ({compteAbsents})
                </TabsTrigger>
              </TabsList>
              <TabsContent value={onglet} className='mt-4 space-y-4'>
                <div className='relative max-w-md'>
                  <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Rechercher…'
                    value={recherche}
                    onChange={(e) => definirRecherche(e.target.value)}
                    className='min-h-11 pl-9'
                  />
                </div>

                {invitesFiltres.length === 0 ? (
                  <EtatVide
                    titre={
                      onglet === 'present'
                        ? 'Aucun invité présent'
                        : 'Aucun invité absent'
                    }
                    description={
                      onglet === 'present'
                        ? 'Les scans QR apparaîtront ici.'
                        : 'Tous les invités sont marqués présents.'
                    }
                  />
                ) : (
                  <ListeAdaptative
                    donnees={invitesFiltres}
                    colonnes={colonnes}
                    cleLigne={(inv) => inv.id_invite}
                    renduCarte={renduCarte}
                  />
                )}
              </TabsContent>
            </Tabs>

            {import.meta.env.DEV ? (
              <p className={cn('text-xs text-muted-foreground')}>
                Mode développement : le bouton « Simuler scan » enregistre une
                présence sans scanner.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </GardeEvenementActif>
  )
}
