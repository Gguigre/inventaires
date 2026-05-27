# Agent — Test

## Rôle

Écrire les tests après que la review a été validée et les corrections appliquées.
Les tests documentent le comportement attendu et protègent contre les régressions.

## Skills à lire avant de commencer

- `skills/testing.md` — conventions, outils, exemples

## Inputs

- `specs/[feature].md` — source de vérité pour les cas à tester
- Code final corrigé (use cases, composants, repositories)
- Rapport de review (pour couvrir les edge cases signalés)

---

## Ce que cet agent produit

### 1. Tests de use cases (Vitest)
Un fichier `use-cases.test.ts` co-localisé avec `use-cases.ts`.

Couvrir systématiquement :
- Happy path
- Validation des inputs (champ vide, format invalide...)
- Erreur retournée par le repository
- Chaque règle métier de la spec

### 2. Tests de composants (Testing Library)
Un fichier `[Composant].test.tsx` co-localisé avec le composant.

Couvrir :
- Rendu dans l'état par défaut
- Interactions clés (clics, saisie...)
- États conditionnels (loading, erreur, vide)
- Accessibilité des éléments interactifs

Ne pas tester :
- Les détails d'implémentation (state interne, noms de fonctions)
- Les styles CSS

### 3. Tests E2E (Playwright) — si parcours critique
Un fichier `e2e/[feature].spec.ts`.

Uniquement si la feature est dans cette liste :
- Parcours complet d'inventaire (frontoffice)
- Login backoffice
- Création / modification d'un sac ou matériel
- Signalement d'anomalie avec commentaire

---

## Checklist avant de commencer

- [ ] La review est validée et les corrections appliquées
- [ ] `skills/testing.md` lu
- [ ] La spec est sous les yeux (source des cas à couvrir)

---

## Checklist par use case

Pour chaque use case de la spec :

- [ ] Test happy path
- [ ] Test validation input vide / invalide
- [ ] Test erreur repository mockée
- [ ] Test chaque règle métier explicite dans la spec

---

## Checklist par composant

Pour chaque composant UI :

- [ ] Test rendu de base (snapshot léger ou assertion sur éléments clés)
- [ ] Test interactions (click, change, submit)
- [ ] Test état loading (si applicable)
- [ ] Test état erreur (si applicable)
- [ ] Test état vide (si applicable)

---

## Règles de l'agent

1. **La spec prime** : si un comportement n'est pas dans la spec,
   ne pas l'inventer comme cas de test.
2. **Mocker les repositories**, jamais Firestore directement.
3. **Un test = une assertion principale**. Ne pas faire des tests
   qui vérifient 5 choses différentes.
4. **Nommer les tests clairement** :
   `'retourne une erreur si le nom est vide'` pas `'test erreur'`.
5. **Ne pas tester les types TypeScript** — le compilateur s'en charge.
6. **Signaler les cas non testables** : si un comportement est impossible
   à tester sans refactoring, le noter en commentaire et le signaler.
