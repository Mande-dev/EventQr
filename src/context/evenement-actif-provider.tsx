import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Evenement, RoleEvenement } from '@/types'
import { memoire } from '@/services/memoire'
import { aPermission, type ActionPermission } from '@/config/permissions-roles'
import { useAuthentification } from '@/hooks/use-authentification'

const CLE_EVENEMENT_ACTIF = 'eventqr_evenement_actif'

type ContexteEvenementActif = {
  evenementActif: Evenement | null
  roleActuel: RoleEvenement | null
  definirEvenementActif: (evenement: Evenement | null) => void
  aLeDroit: (action: ActionPermission) => boolean
}

const EvenementActifContext = createContext<ContexteEvenementActif | null>(null)

/** Lit l'id d'événement actif depuis le stockage local. */
function lireIdStocke(): string | null {
  try {
    return localStorage.getItem(CLE_EVENEMENT_ACTIF)
  } catch {
    return null
  }
}

/** Persiste l'id d'événement actif. */
function ecrireIdStocke(id: string | null): void {
  try {
    if (id) localStorage.setItem(CLE_EVENEMENT_ACTIF, id)
    else localStorage.removeItem(CLE_EVENEMENT_ACTIF)
  } catch {
    /* ignore */
  }
}

type ProprietesFournisseur = {
  children: React.ReactNode
}

/** Fournit l'événement actif et le rôle de l'utilisateur dessus. */
export function FournisseurEvenementActif({ children }: ProprietesFournisseur) {
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const [evenementActif, definirEtat] = useState<Evenement | null>(() => {
    const id = lireIdStocke()
    if (!id) return null
    return memoire.evenements.find((e) => e.id_evenement === id) ?? null
  })

  // Recalcule le rôle sur l'événement actif pour l'utilisateur connecté.
  const roleActuel = useMemo((): RoleEvenement | null => {
    if (!utilisateur || !evenementActif) return null
    const lien = memoire.utilisateursEvenements.find(
      (item) =>
        item.id_utilisateur === utilisateur.id_utilisateur &&
        item.id_evenement === evenementActif.id_evenement
    )
    return lien?.role_evenement ?? null
  }, [utilisateur, evenementActif])

  // Si l'utilisateur n'a plus accès à l'événement stocké, on le retire.
  useEffect(() => {
    if (!utilisateur || !evenementActif) return
    const aAcces = memoire.utilisateursEvenements.some(
      (item) =>
        item.id_utilisateur === utilisateur.id_utilisateur &&
        item.id_evenement === evenementActif.id_evenement &&
        item.role_evenement !== 'Agent de contrôle'
    )
    if (!aAcces) {
      definirEtat(null)
      ecrireIdStocke(null)
    }
  }, [utilisateur, evenementActif])

  // Définit l'événement actif et le persiste.
  const definirEvenementActif = (evenement: Evenement | null) => {
    definirEtat(evenement)
    ecrireIdStocke(evenement?.id_evenement ?? null)
  }

  // Vérifie une permission sur l'événement actif.
  const aLeDroit = (action: ActionPermission) => aPermission(roleActuel, action)

  const valeur = useMemo(
    () => ({
      evenementActif,
      roleActuel,
      definirEvenementActif,
      aLeDroit,
    }),
    [evenementActif, roleActuel]
  )

  return (
    <EvenementActifContext.Provider value={valeur}>
      {children}
    </EvenementActifContext.Provider>
  )
}

/** Accède au contexte d'événement actif. */
export function useEvenementActif(): ContexteEvenementActif {
  const contexte = useContext(EvenementActifContext)
  if (!contexte) {
    throw new Error(
      'useEvenementActif doit être utilisé dans FournisseurEvenementActif.'
    )
  }
  return contexte
}
