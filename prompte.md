RÔLE
Tu es un développeur front-end senior (React + TypeScript). Un template existe déjà dans ce projet. Ta mission : l'adapter aux couleurs, aux fonctionnalités et à la logique d'EventQR (plateforme SaaS de gestion d'événements avec invitations à QR code) pour l'interface du Super Administrateur.

PÉRIMÈTRE STRICT
- Front-end uniquement : React + TypeScript (mode strict). Aucun back-end, aucune API réelle, aucune base de données.
- Le template est conservé tel quel dans sa structure (layout, composants, routing, outils de build, librairie UI). Tu ne le réécris PAS : tu changes seulement les couleurs (thème), les textes, les pages, les données et la logique métier pour correspondre à ce prompt. Supprime ou masque ce qui n'appartient pas à EventQR.
- Données : mocks typés (src/mocks/) servis par une couche services (src/services/) qui simule une latence (Promise + setTimeout). Le futur branchement d'une vraie API ne changera que cette couche.
- Pas de paiement, pas d'abonnement, pas de facturation.

CONVENTIONS DE CODE (OBLIGATOIRES)
1. Nommage en français, sans accents dans les identifiants :
   - variables, constantes, fonctions, paramètres, interfaces, types, énumérations, composants, fichiers de mocks/services.
   - Exemples : listeUtilisateurs, evenementSelectionne, TAILLE_PAGE, chargerEvenements(), basculerStatutUtilisateur(), interface Utilisateur, type RoleEvenement, composant TableauDeBord, TableauDonnees, ModaleConfirmation.
   - Constantes en MAJUSCULES_AVEC_TIRETS_BAS, fonctions/variables en camelCase, composants/types en PascalCase.
   - Les hooks gardent le préfixe "use" exigé par React, suivi d'un nom français (ex. useUtilisateurs, useAuthentification).
   - Les noms imposés par les librairies (props, API externes) restent inchangés.
2. Commentaires : avant CHAQUE fonction (y compris composants, hooks et fonctions fléchées), place un commentaire en français, court (une à deux lignes) qui explique ce qu'elle fait. Pas de commentaires inutiles à l'intérieur du code.
   Exemple :
   // Filtre la liste des utilisateurs selon le texte saisi dans la recherche.
   const filtrerUtilisateurs = (liste: Utilisateur[], recherche: string): Utilisateur[] => { ... }
3. TypeScript strict, zéro `any`, composants fonctionnels et hooks, code organisé par domaine (pages/, composants/, services/, mocks/, types/, hooks/, styles/).

RESPONSIVE (100 %)
- Toute l'interface doit être parfaitement utilisable de 320 px (petit mobile) à grand écran, sans défilement horizontal de la page.
- Approche mobile-first avec des points de rupture cohérents (mobile, tablette, ordinateur).
- Sidebar : fixe sur ordinateur, repliable en tiroir (menu burger) sur mobile et tablette.
- Tableaux : sur mobile, soit conversion en cartes empilées, soit conteneur à défilement horizontal interne ; jamais de débordement de la page.
- Cartes de statistiques et grilles : 1 colonne sur mobile, 2 sur tablette, 3 à 4 sur ordinateur.
- Graphiques adaptatifs (conteneur responsive), formulaires en colonne unique sur mobile, modales et tiroirs plein écran sur petit écran.
- Zones tactiles d'au moins 44 px, textes lisibles sans zoom.

IDENTITÉ VISUELLE
Applique ces couleurs au thème du template via des variables CSS / tokens centralisés (aucune couleur en dur dans les composants) :
- Principal #0A4B7A | Bleu clair #1A6FA0 | Bleu nuit #07385B | Accent cyan/turquoise #10B981
- Fond #F8FAFC | Carte #FFFFFF | Bordure #E5E7EB
- Texte #1A1A1A | secondaire #525252 | discret #8C8C8C
- États : succès/présent #22C55E, attention #F59E0B, erreur/QR invalide #EF4444, information #8B5CF6
Règles d'usage :
- #0A4B7A domine : sidebar, boutons principaux, titres importants, éléments actifs, icônes principales.
- #1A6FA0 : hover secondaire, liens, éléments interactifs.
- #07385B : sidebar premium, header sombre, sections importantes, hover des boutons principaux.
- #10B981 reste un accent (QR, indicateurs positifs, statut présent, petits highlights), jamais dominant.
- Bouton principal : fond #0A4B7A, texte blanc, hover #07385B. Bouton secondaire : fond blanc + bordure #0A4B7A.
- Police Inter, coins arrondis 8–12 px, ombres très légères, beaucoup d'espace blanc, icônes simples et modernes (lucide-react). Pas de dégradés, sauf sur le logo et d'éventuels éléments premium.
- Logo : composant <Logo /> en SVG inline (icône QR stylisée dégradé #0A4B7A → #1A6FA0 → #10B981, anneau #10B981, texte "Event" #07385B + "Q" #1A6FA0 + "R" #10B981), avec une variante complète et une variante icône seule pour la sidebar réduite. Le logo reste visuellement dominant.
[COLLER ICI LE SVG DU LOGO]

MODÈLE DE DONNÉES (interfaces TypeScript dans src/types/, nommées en français)
- Utilisateur : id_utilisateur, nom, prenom, email, telephone, mot_de_passe (jamais affiché), role_systeme ("super_admin" | "utilisateur"), actif (boolean), date_creation
- Evenement : id_evenement, id_utilisateur_proprietaire, nom_evenement, type_evenement, date_evenement, heure_evenement, lieu, date_creation
- UtilisateurEvenement : id_utilisateur_evenement, id_utilisateur, id_evenement, role_evenement ("Propriétaire" | "Organisateur" | "Agent de contrôle"), date_affectation
- Invite : id_invite, id_evenement, nom, prenom, telephone, nombre_personnes, code_qr, statut_presence ("present" | "absent"), date_scan, date_creation
- TableEvenement : id_table, id_evenement, numero_table, capacite
- Affectation : id_affectation, id_invite, id_table, date_affectation
- ModeleInvitation : id_modele, id_evenement, fichier_pdf, zone_nom_x, zone_nom_y, zone_nom_largeur, zone_nom_hauteur, zone_qr_x, zone_qr_y, zone_qr_largeur, zone_qr_hauteur, date_creation
Génère des mocks réalistes et cohérents : au moins 15 utilisateurs (dont quelques désactivés), 12 événements de types variés (mariage, conférence, anniversaire, séminaire…), 200+ invités, noms francophones/congolais.

PAGES DU SUPER ADMINISTRATEUR (6 seulement)
1. Tableau de bord : cartes de statistiques (nombre d'utilisateurs, d'événements, total d'invités, taux de présence), graphique d'évolution, événements récents, utilisateurs récents.
2. Utilisateurs : tableau avec recherche, tri et pagination ; détails d'un utilisateur ; créer et modifier (formulaire validé) ; activer/désactiver ; supprimer avec modale de confirmation. Les changements s'appliquent à l'état local pendant la session.
3. Événements : liste avec recherche et filtres (type, date) ; détails : informations générales, propriétaire, utilisateurs affectés et leur rôle. Lecture seule (le Super Admin consulte, ne gère pas les invités).
4. Statistiques : utilisateurs, événements, nombre d'événements par type, total d'invités, présence (présents / absents), statistiques globales. Graphiques (recharts) aux couleurs de la charte.
5. Paramètres : Général d'EventQR, informations de la plateforme, sécurité (longueur minimale du mot de passe, durée de session), configuration. Formulaires validés, sauvegarde simulée avec notification.
6. Profil : voir et modifier ses informations, changer son mot de passe (ancien, nouveau, confirmation, indicateur de force), se déconnecter.

LOGIQUE FRONT
- Authentification simulée : page de connexion, session en mémoire ou sessionStorage, routes protégées, accès réservé au rôle super_admin.
- Routing : une route par page + /connexion, en réutilisant le routeur du template.
- Layout : sidebar avec les 6 entrées, header avec menu profil.
- États obligatoires sur chaque page : chargement (skeletons), vide, erreur.
- Composants réutilisables typés : tableau de données, carte de statistique, modale de confirmation, badge de statut (Présent vert, Attention orange, Invalide rouge, Info violet), champ de formulaire, notification, état vide.
- Validation de formulaires avec react-hook-form + zod (si le template n'en utilise pas déjà une autre).
- Interface entièrement en français ; dates au format jj/mm/aaaa.
- Accessibilité de base : labels, focus visibles, contrastes suffisants, navigation clavier.

MÉTHODE DE TRAVAIL
1. Analyse le template et présente un plan court : ce que tu gardes, adaptes, supprimes.
2. Applique les tokens de couleurs, le logo, la police, puis adapte le layout (sidebar, header) en responsive.
3. Crée types, mocks et services (nommage français, commentaire avant chaque fonction).
4. Implémente les pages une par une, de 1 à 6, en vérifiant le rendu mobile, tablette et ordinateur à chaque page.
5. Termine par une vérification : build sans erreur TypeScript, lint propre, aucune couleur en dur, aucun identifiant en anglais (hors noms imposés par les librairies), et un résumé de ce qu'il restera à brancher côté back-end.
Si une information manque, pose-moi la question avant de supposer.