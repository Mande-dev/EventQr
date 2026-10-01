import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Loader2, UserMinus } from 'lucide-react'
import type { Invite } from '@/types'
import { listerInvitesNonAffectes, listerTables, type TableEnrichie } from '@/services/tables'
import { affecterInvite, retirerAffectation } from '@/services/tables'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useEcran } from '@/hooks/use-ecran'
import { afficherErreur } from '@/lib/alertes'
import { libelleTable } from '@/lib/formatage'
import { cn } from '@/lib/utils'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PREFIX_INVITE = 'invite-'
const PREFIX_TABLE = 'table-'

/** Extrait l’id invité depuis l’identifiant draggable. */
function idInviteDepuisDraggable(id: string): string {
  return id.replace(PREFIX_INVITE, '')
}

/** Extrait l’id table depuis l’identifiant droppable. */
function idTableDepuisDroppable(id: string): string {
  return id.replace(PREFIX_TABLE, '')
}

type ProprietesCarteInvite = {
  invite: Invite
}

/** Affichage statique d’une carte invité. */
function CarteInviteAffichage({ invite }: ProprietesCarteInvite) {
  return (
    <div className='rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xs'>
      <p className='font-medium'>{invite.nom_complet}</p>
    </div>
  )
}

/** Carte invité draggable (bureau). */
function CarteInviteDraggable({ invite }: ProprietesCarteInvite) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PREFIX_INVITE}${invite.id_invite}`,
    data: { invite },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xs touch-none active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <p className='font-medium'>{invite.nom_complet}</p>
    </div>
  )
}

type ProprietesZoneTable = {
  table: TableEnrichie
  onRetirer: (idInvite: string) => void
  enCours: boolean
}

/** Zone de dépôt pour une table (bureau). */
function ZoneTableDroppable({
  table,
  onRetirer,
  enCours,
}: ProprietesZoneTable) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${PREFIX_TABLE}${table.id_table}`,
    data: { table },
  })

  const pct =
    table.capacite > 0
      ? Math.min(100, (table.places_occupees / table.capacite) * 100)
      : 0

  return (
    <article
      ref={setNodeRef}
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-colors duration-150',
        isOver && 'border-primary bg-accent/50'
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <h3 className='font-semibold'>
          {libelleTable(table.numero_table, table.nom_table)}
        </h3>
        <span className='text-xs text-muted-foreground'>
          {table.places_occupees}/{table.capacite}
        </span>
      </div>
      <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-muted'>
        <div
          className={cn(
            'h-full rounded-full',
            table.places_disponibles <= 0 ? 'bg-attention' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className='mt-3 flex flex-col gap-2'>
        {table.invites.map((inv) => (
          <li
            key={inv.id_invite}
            className='flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-sm'
          >
            <span>{inv.nom_complet}</span>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-9 shrink-0 text-destructive'
              aria-label='Retirer l’affectation'
              disabled={enCours}
              onClick={() => onRetirer(inv.id_invite)}
            >
              <UserMinus className='size-4' />
            </Button>
          </li>
        ))}
        {table.invites.length === 0 ? (
          <li className='text-xs text-muted-foreground'>
            Glissez un invité ici
          </li>
        ) : null}
      </ul>
    </article>
  )
}

/** Contenu principal page affectation. */
function ContenuAffectation() {
  const { evenementActif, aLeDroit } = useEvenementActif()
  const { estMobile } = useEcran()
  const clientRequetes = useQueryClient()
  const idEvenement = evenementActif!.id_evenement

  const [inviteEnDrag, definirInviteEnDrag] = useState<Invite | null>(null)

  const peutGerer = aLeDroit('gerer_affectations')

  const requeteNonAffectes = useQuery({
    queryKey: ['invites-non-affectes', idEvenement],
    queryFn: () => listerInvitesNonAffectes(idEvenement),
  })

  const requeteTables = useQuery({
    queryKey: ['tables', idEvenement],
    queryFn: () => listerTables(idEvenement),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const invalider = async () => {
    await clientRequetes.invalidateQueries({
      queryKey: ['invites-non-affectes', idEvenement],
    })
    await clientRequetes.invalidateQueries({ queryKey: ['tables', idEvenement] })
    await clientRequetes.invalidateQueries({ queryKey: ['invites', idEvenement] })
  }

  const mutationAffecter = useMutation({
    mutationFn: ({
      idInvite,
      idTable,
    }: {
      idInvite: string
      idTable: string
    }) => affecterInvite(idInvite, idTable),
    onSuccess: async () => {
      await invalider()
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Affectation impossible', erreur.message)
    },
  })

  const mutationRetirer = useMutation({
    mutationFn: retirerAffectation,
    onSuccess: async () => {
      await invalider()
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Retrait impossible', erreur.message)
    },
  })

  const enCours =
    mutationAffecter.isPending || mutationRetirer.isPending

  const nonAffectes = requeteNonAffectes.data ?? []
  const tables = useMemo(() => {
    if (!requeteTables.data) return []
    return [...requeteTables.data].sort((a, b) => a.numero_table - b.numero_table)
  }, [requeteTables.data])

  const chargement =
    requeteNonAffectes.isLoading || requeteTables.isLoading
  const erreur = requeteNonAffectes.isError || requeteTables.isError

  /** Réessaie le chargement des données. */
  const reessayer = () => {
    void requeteNonAffectes.refetch()
    void requeteTables.refetch()
  }

  /** Début du glisser-déposer. */
  const debutDrag = (event: DragStartEvent) => {
    const invite = event.active.data.current?.invite as Invite | undefined
    definirInviteEnDrag(invite ?? null)
  }

  /** Fin du glisser-déposer : affectation si dépôt sur table. */
  const finDrag = (event: DragEndEvent) => {
    definirInviteEnDrag(null)
    if (!peutGerer) return
    const { active, over } = event
    if (!over) return
    const idCible = String(over.id)
    if (!idCible.startsWith(PREFIX_TABLE)) return
    const idInvite = idInviteDepuisDraggable(String(active.id))
    const idTable = idTableDepuisDroppable(idCible)
    mutationAffecter.mutate({ idInvite, idTable })
  }

  /** Affectation mobile via sélecteur. */
  const affecterViaSelect = (idInvite: string, idTable: string) => {
    if (!idTable || !peutGerer) return
    mutationAffecter.mutate({ idInvite, idTable })
  }

  /** Retire un invité de sa table. */
  const retirer = (idInvite: string) => {
    if (!peutGerer) return
    mutationRetirer.mutate(idInvite)
  }

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      {chargement ? <SquelettePage /> : null}
      {erreur ? (
        <EtatErreur
          message='Impossible de charger l’affectation.'
          onReessayer={reessayer}
        />
      ) : null}

      {!chargement && !erreur ? (
        <>
          <section>
            <h2 className='mb-3 text-sm font-semibold text-primary'>
              Invités non affectés ({nonAffectes.length})
            </h2>
            {nonAffectes.length === 0 && estMobile ? (
              <EtatVide
                titre='Tous les invités sont affectés'
                description='Retirez une affectation pour réorganiser.'
              />
            ) : estMobile ? (
              <ul className='flex flex-col gap-3'>
                {nonAffectes.map((invite) => (
                  <li
                    key={invite.id_invite}
                    className='rounded-xl border border-border bg-card p-3'
                  >
                    <p className='font-medium'>{invite.nom_complet}</p>
                    {peutGerer ? (
                      <Select
                        onValueChange={(idTable) =>
                          affecterViaSelect(invite.id_invite, idTable)
                        }
                        disabled={enCours || tables.length === 0}
                      >
                        <SelectTrigger className='mt-2 min-h-11 w-full'>
                          <SelectValue placeholder='Choisir une table…' />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((t) => (
                            <SelectItem
                              key={t.id_table}
                              value={t.id_table}
                              disabled={t.places_disponibles < 1}
                            >
                              {libelleTable(t.numero_table, t.nom_table)} (
                              {t.places_disponibles} libre
                              {t.places_disponibles > 1 ? 's' : ''})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={debutDrag}
                onDragEnd={finDrag}
              >
                <div className='grid gap-6 lg:grid-cols-[minmax(240px,320px)_1fr]'>
                  <div className='flex flex-col gap-2'>
                    {nonAffectes.length === 0 ? (
                      <p className='rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground'>
                        Tous les invités sont affectés. Retirez une affectation
                        depuis une table pour réorganiser.
                      </p>
                    ) : (
                      nonAffectes.map((invite) => (
                        <CarteInviteDraggable
                          key={invite.id_invite}
                          invite={invite}
                        />
                      ))
                    )}
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                    {tables.length === 0 ? (
                      <EtatVide
                        titre='Aucune table'
                        description='Créez des tables avant d’affecter.'
                      />
                    ) : (
                      tables.map((table) => (
                        <ZoneTableDroppable
                          key={table.id_table}
                          table={table}
                          onRetirer={retirer}
                          enCours={enCours}
                        />
                      ))
                    )}
                  </div>
                </div>
                <DragOverlay>
                  {inviteEnDrag ? (
                    <CarteInviteAffichage invite={inviteEnDrag} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </section>

          {estMobile && tables.length > 0 ? (
            <section>
              <h2 className='mb-3 text-sm font-semibold text-primary'>Tables</h2>
              <ul className='flex flex-col gap-3'>
                {tables.map((table) => (
                  <li
                    key={table.id_table}
                    className='rounded-xl border border-border bg-card p-4'
                  >
                    <div className='flex justify-between text-sm'>
                      <span className='font-semibold'>
                        {libelleTable(table.numero_table, table.nom_table)}
                      </span>
                      <span className='text-muted-foreground'>
                        {table.places_occupees}/{table.capacite}
                      </span>
                    </div>
                    <ul className='mt-2 flex flex-col gap-1'>
                      {table.invites.map((inv) => (
                        <li
                          key={inv.id_invite}
                          className='flex items-center justify-between text-sm'
                        >
                          <span>{inv.nom_complet}</span>
                          {peutGerer ? (
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='text-destructive'
                              disabled={enCours}
                              onClick={() => retirer(inv.id_invite)}
                            >
                              Retirer
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {enCours ? (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' />
              Mise à jour…
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/** Page affectation invités / tables. */
export function PageAffectation() {
  const { estMobile } = useEcran()

  return (
    <>
      <EnTeteOrganisateur
        titre='Affectation'
        actions={
          !estMobile ? (
            <>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />
      <GardeEvenementActif>
        <ContenuAffectation />
      </GardeEvenementActif>
    </>
  )
}
