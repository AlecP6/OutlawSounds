# Outlaw Sounds — Label RP

Site de **comptabilité** et **gestion** pour le label **Outlaw Sounds** en roleplay.

**Dépôt** : [github.com/AlecP6/OutlawSounds](https://github.com/AlecP6/OutlawSounds)

## Contenu

- **Tableau de bord** : revenus, dépenses, nombre d’artistes.
- **Comptabilité** : dépenses, revenus (subventions, YouTube), bilan de la semaine.
- **Historique** : mouvements comptables par période.
- **Subventions** : suivi des subventions.
- **Revenus YouTube** : vues, tarifs (350 $/vue sans clip, 500 $/vue avec clip), répartition label/artiste selon contrats.
- **Gestion** : artistes, sorties (single, EP, album), contrats avec % label / % artiste.
- **Suivi artistes** : fiches artistes, contrats, sorties.

Les données sont stockées dans le **navigateur** (localStorage), sans serveur.

## Lancer le site

Ouvrir `index.html` dans un navigateur (double-clic ou « Ouvrir avec »), ou servir le dossier avec un serveur local, par exemple :

```bash
# avec Python
python -m http.server 8080

# avec Node (npx)
npx serve .
```

Puis aller sur `http://localhost:8080` (ou le port indiqué).

## Fichiers

| Fichier | Rôle |
|--------|------|
| `index.html` | Page d’accueil / tableau de bord |
| `comptabilite.html` | Revenus, dépenses, bilan |
| `gestion.html` | Artistes, sorties, contrats |
| `styles.css` | Styles communs |
| `app.js` | Données (localStorage), stats, formatage |
| `comptabilite.js` | Formulaire et listes comptabilité |
| `gestion.js` | Formulaires et listes gestion |

## Déploiement (GitHub Pages)

1. Pousser le code sur le dépôt :
   ```bash
   git init
   git add .
   git commit -m "Outlaw Sounds — site label RP"
   git remote add origin https://github.com/AlecP6/OutlawSounds.git
   git branch -M main
   git push -u origin main
   ```

2. Sur GitHub : **Settings** → **Pages** → **Source** : choisir la branche **main** et le dossier **/ (root)** → **Save**.

3. Le site sera en ligne à l’adresse :  
   `https://alecp6.github.io/OutlawSounds/`
