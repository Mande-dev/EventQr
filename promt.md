RÔLE
Tu es un développeur front-end senior (React + TypeScript). Le projet contient déjà le template adapté à EventQR et l'interface du Super Administrateur (thème, logo, layout, composants réutilisables, mocks, services, authentification simulée). Ta mission : ajouter la PARTIE ORGANISATEUR, en réutilisant tout l'existant. Ne réécris rien de ce qui fonctionne déjà.

PÉRIMÈTRE STRICT
- Front-end uniquement : React + TypeScript strict. Aucun back-end, aucune API réelle.
- Données via mocks typés et couche services (latence simulée), comme pour le Super Admin. Étends les mocks existants (mêmes interfaces : Utilisateur, Evenement, UtilisateurEvenement, Invite, TableEvenement, Affectation, ModeleInvitation).
- Pas de paiement, pas d'abonnement.
- Les mêmes CONVENTIONS restent obligatoires :
  * variables, constantes, fonctions, types, composants, fichiers nommés en français (sans accents dans les identifiants) ; hooks avec préfixe "use" + nom français ;
  * un commentaire court et explicatif en français avant CHAQUE fonction ;
  * aucun `any`, aucune couleur en dur (tokens du thème uniquement).

IDENTITÉ VISUELLE
Reprends exactement la charte existante : #0A4B7A (principal), #1A6FA0, #07385B, accent #10B981, fond #F8FAFC, cartes #FFFFFF, bordures #E5E7EB, états (succès #22C55E, attention #F59E0B, erreur #EF4444, info #8B5CF6), police Inter, coins 8–12 px, ombres très légères. Le cyan #10B981 reste un accent.

DESIGN : APPLICATION MOBILE ET WEB EN MÊME TEMPS
Une seule base de code, deux expériences qui se ressentent comme des applications natives :
Sur mobile (< 768 px) :
- Barre de navigation fixe en bas (5 entrées maximum + un onglet "Plus" ouvrant un tiroir avec le reste), icône + libellé court, onglet actif en #0A4B7A.
- En-tête compact de type application (titre de page, bouton retour, actions à droite), fixe en haut.
- Bouton d'action flottante (FAB) pour les actions principales (ajouter un invité, créer un événement, etc.).
- Modales et formulaires en "bottom sheets" plein écran ou semi-plein écran, glissement vertical.
- Listes en cartes tactiles (pas de tableaux larges), recherche en haut, défilement fluide, "tirer pour rafraîchir" simulé.
- Zones tactiles ≥ 44 px, gestion des zones sûres (safe-area) pour iPhone, pas de survol requis.
Sur tablette et ordinateur (≥ 768 px) :
- Sidebar latérale (#0A4B7A/#07385B), réductible en icônes, header avec recherche et menu profil.
- Tableaux complets, panneaux latéraux (drawers), modales centrées, grilles multi-colonnes.
Commun :
- Transitions douces (150–250 ms), états de chargement en skeletons, états vides illustrés, notifications discrètes.
- Application installable (PWA de base : manifest, icônes, theme-color #0A4B7A, mode standalone) ; pas de mode hors-ligne complexe.
- Aucun défilement horizontal de la page de 320 px à grand écran ; l'interface doit être testée à 360, 768 et 1280 px.
- Un hook useEcran (ou équivalent) + composants "adaptatifs" (ex. ListeAdaptative : cartes sur mobile, tableau sur ordinateur ; FeuilleModale : bottom sheet sur mobile, modale centrée sur ordinateur).

RÔLES ET ACCÈS
- Rôles d'événement : Propriétaire, Organisateur, Agent de contrôle (table UTILISATEUR_EVENEMENT).
- Le Propriétaire et l'Organisateur accèdent à l'interface Organisateur (11 pages ci-dessous).
- L'Agent de contrôle n'y a PAS accès : s'il se connecte, il est redirigé vers une interface distincte, beaucoup plus limitée, centrée sur le scanner QR et le contrôle des entrées. Cette interface sera faite dans une étape suivante : crée seulement la route protégée /agent avec une page provisoire "Espace agent de contrôle" et la garde de rôle.
- Hypothèse de permissions (à appliquer, facile à modifier via une constante PERMISSIONS_ROLES) : seul le Propriétaire peut supprimer un événement et modifier/retirer le Propriétaire ; l'Organisateur gère tout le reste (invités, tables, affectations, invitations, utilisateurs de l'événement hors Propriétaire).
- Garde de routes selon le rôle système et le rôle dans l'événement ; le Super Admin garde son interface séparée.

NAVIGATION ET LOGIQUE D'ÉVÉNEMENT
- Les pages 1 et 2 et 11 sont globales (tous les événements de l'utilisateur).
- Les pages 3 à 10 travaillent sur UN événement actif : quand l'utilisateur ouvre un événement (depuis le tableau de bord ou "Mes événements"), un contexte (EvenementActifContext) le mémorise, et un bandeau/sélecteur affiche le nom de l'événement en haut, avec possibilité de changer.
- Mobile : barre du bas = Accueil, Événements, Invités, Présences, Plus (Utilisateurs de l'événement, Tables, Affectation, Invitation, Génération, Statistiques, Profil). Ordinateur : sidebar groupée en sections "Général" et "Événement en cours".
- Si aucun événement n'est actif, les pages 3 à 10 affichent un état vide qui invite à en choisir un.

PAGES DE L'INTERFACE ORGANISATEUR
1. Tableau de bord : cartes (nombre d'événements, total d'invités, présents, absents), liste des événements à venir, accès rapide à un événement, mini-graphique de présence.
2. Mes événements : liste/cartes, recherche, créer (formulaire : nom, type, date, heure, lieu), modifier, voir les détails, supprimer avec confirmation. Ouvrir un événement le définit comme actif.
3. Utilisateurs de l'événement : liste des utilisateurs affectés avec leur rôle ; ajouter (recherche d'un utilisateur existant), attribuer et modifier le rôle (Propriétaire, Organisateur, Agent de contrôle), retirer avec confirmation. Un événement garde toujours au moins un Propriétaire.
4. Invités : liste avec recherche et filtres (présent/absent, affecté/non affecté) ; ajouter, modifier, supprimer ; importer plusieurs invités depuis un fichier CSV/Excel (aperçu, validation ligne par ligne, rapport d'erreurs avant import ; fournir un modèle téléchargeable) ; afficher le statut de présence et la table de chaque invité. Chaque invité reçoit un code_qr unique généré à la création.
5. Tables : créer, modifier, supprimer ; définir la capacité ; afficher places occupées/disponibles (barre de progression) ; voir les invités de chaque table. Interdire de réduire la capacité sous le nombre de places déjà occupées.
6. Affectation : liste des invités non affectés ; affecter à une table (sélection ou glisser-déposer sur ordinateur, sélecteur sur mobile) ; modifier ou retirer l'affectation ; vérifier la capacité (tenir compte de nombre_personnes de chaque invité) et bloquer/avertir en cas de dépassement.
7. Invitation (modèle) : importer le PDF modèle ; le visualiser (pdfjs-dist ou react-pdf) ; dessiner/sélectionner la zone du nom et la zone du QR Code ; déplacer et redimensionner les zones (react-rnd ou équivalent, gestes tactiles inclus, zoom possible) ; enregistrer le modèle (coordonnées zone_nom_x/y/largeur/hauteur et zone_qr_x/y/largeur/hauteur) ; prévisualiser une invitation avec un invité fictif. Le PDF modèle est conservé (mock : en mémoire ou IndexedDB).
8. Génération des invitations : sélectionner un ou plusieurs invités, ou tous ; générer une ou plusieurs invitations en PDF (pdf-lib + librairie de QR code) en plaçant nom et QR dans les zones du modèle ; exporter/télécharger en PDF (un seul PDF multi-pages ou un fichier par invité en ZIP). Les PDF personnalisés générés ne sont PAS enregistrés (aucun stockage, aucun historique) ; barre de progression pour les gros lots ; désactiver la page si aucun modèle n'est enregistré, avec lien vers la page 7.
9. Présences : onglets Présents / Absents, recherche, heure du scan (date_scan), table de l'invité ; mise à jour visuelle claire (badge vert/orange). Pour tester sans scanner, prévoir un bouton de démonstration réservé au mode développement pour simuler un scan.
10. Statistiques : total des invités, présents, absents, invités affectés, invités non affectés, occupation des tables ; graphiques (recharts) aux couleurs de la charte, adaptatifs.
11. Profil : voir et modifier ses informations, modifier le mot de passe (validation de force), se déconnecter.

LOGIQUE ET QUALITÉ
- États obligatoires partout : chargement, vide, erreur, succès.
- Validation avec react-hook-form + zod (téléphone, champs requis, capacité > 0, nombre_personnes ≥ 1).
- Confirmation avant toute suppression ; annulation possible (notification "Annuler") quand c'est simple.
- Interface entièrement en français, dates jj/mm/aaaa, heures 24 h.
- Accessibilité de base : labels, focus visibles, contrastes, navigation clavier.
- Ajoute uniquement les dépendances nécessaires (pdf, QR, import de fichiers, glisser-déposer) et justifie-les.

MÉTHODE DE TRAVAIL
1. Analyse l'existant (composants, thème, mocks, routes) et présente un plan court : ce que tu réutilises, ce que tu crées.
2. Mets en place le layout adaptatif mobile/web, le contexte d'événement actif, les gardes de rôle et la route /agent provisoire.
3. Étends types, mocks et services.
4. Implémente les pages de 1 à 11, en testant mobile, tablette et ordinateur à chaque page.
5. Termine par une vérification : build sans erreur TypeScript, lint propre, aucune couleur en dur, nommage français respecté, commentaire avant chaque fonction, et la liste de ce qu'il restera à brancher côté back-end (QR, génération de PDF, import).
Si une information manque, pose-moi la question avant de supposer.