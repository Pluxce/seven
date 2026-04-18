# Convention de commits — Centre Médical SEVEN

## Format

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel]
```

## Types

| Type       | Usage                                                   |
|------------|---------------------------------------------------------|
| `feat`     | Nouvelle fonctionnalité                                 |
| `fix`      | Correction de bug                                       |
| `refactor` | Refactorisation (ni feat ni fix)                        |
| `style`    | Mise en forme, UI (pas de logique)                      |
| `docs`     | Documentation uniquement                                |
| `chore`    | Maintenance, dépendances, config                        |
| `test`     | Ajout ou modification de tests                          |

## Scopes courants

`auth`, `db`, `api`, `ui`, `landing`, `patients`, `appointments`, `demandes`, `visits`, `invoices`, `evaluations`, `records`, `layout`

## Exemples

```
feat(demandes): confirmation RDV crée un compte Supabase + envoie l'email
fix(auth): correction du login patient après rechargement de page
style(landing): suppression des ombres, animations d'entrée
chore(deps): installation de @supabase/supabase-js
```

## Règles

- Descriptions en **français**
- Pas de point final
- Description < 72 caractères
- Corps séparé par une ligne vide si nécessaire
