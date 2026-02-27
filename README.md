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

## Déploiement (Vercel)

Le projet est prêt pour Vercel (site statique, pas de build).

**Option A — Via le site Vercel (recommandé)**  
1. Va sur [vercel.com](https://vercel.com) et connecte-toi (avec ton compte GitHub).  
2. **Add New** → **Project** → importe le dépôt **AlecP6/OutlawSounds**.  
3. Vercel détecte un site statique : ne modifie rien, clique sur **Deploy**.  
4. Une fois le déploiement terminé, tu auras une URL du type :  
   `https://outlaw-sounds-xxx.vercel.app`  
   (tu peux ajouter un nom de domaine personnalisé dans les paramètres du projet.)

**Option B — En ligne de commande**  
1. Installe le CLI : `npm i -g vercel`  
2. Dans le dossier du projet :  
   ```bash
   cd c:\Users\pxksa\Documents\Label
   vercel
   ```  
3. Suis les questions (lien au projet GitHub si tu veux les déploiements automatiques à chaque push).
