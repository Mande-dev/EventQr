import { useSyncExternalStore } from 'react'

const SEUIL_MOBILE = 768
const REQUETE_MOBILE = `(max-width: ${SEUIL_MOBILE - 1}px)`

/** S'abonne aux changements de media query. */
function sAbonner(callback: () => void): () => void {
  const mql = window.matchMedia(REQUETE_MOBILE)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/** Lit si l'écran est mobile (< 768 px). */
function lireEstMobile(): boolean {
  return window.matchMedia(REQUETE_MOBILE).matches
}

/** Valeur serveur / SSR : desktop par défaut. */
function lireEstMobileServeur(): boolean {
  return false
}

/**
 * Hook d'écran adaptatif : mobile (< 768) vs tablette/ordinateur.
 * Alias sémantique EventQR de useIsMobile.
 */
export function useEcran() {
  const estMobile = useSyncExternalStore(
    sAbonner,
    lireEstMobile,
    lireEstMobileServeur
  )

  return {
    estMobile,
    estBureau: !estMobile,
    seuilMobile: SEUIL_MOBILE,
  }
}
