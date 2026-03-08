# MediaCleaner Redact Pro

Architecture actuelle:

- frontend React/Vite lance avec `npm`
- backend Python/FastAPI lance avec `python`
- historique local des traitements dans SQLite

## Ce que fait le produit

- nettoie les metadonnees
- allege les fichiers quand c'est possible
- masque le texte visible en option sur images, PDF et videos
- conserve le texte des slides PowerPoint

## Lancer le frontend React

```bash
npm install
npm run dev
```

Frontend dev:

```text
http://127.0.0.1:5173
```

## Lancer le backend Python

```bash
python -m pip install -r requirements.txt
python server.py
```

Backend API:

```text
http://127.0.0.1:8000
```

## Build du frontend

```bash
npm run build
```

Le build React sort dans `frontend-dist/`. Si ce dossier existe, `server.py` peut le servir directement.

## Telechargement desktop

Si tu veux afficher un bouton de telechargement `.exe` dans le site:

1. depose ton fichier dans `public/downloads/`
2. rebuild le frontend avec `npm run build`

Exemple attendu:

```text
public/downloads/MediaCleaner_Redact_Pro.exe
```

Le site detectera automatiquement le `.exe` et activera la section de telechargement desktop.

## API utile

- `GET /api/health`
- `GET /api/jobs`
- `POST /api/process`

## Notes

- La base SQLite est stockee dans `data/mediacleaner.db`.
- Les modeles OCR sont stockes dans `.models/`.
- Le mode `Masquer le texte visible` est plus lent.
- Sur `.pptx`, le backend optimise les medias embarques et nettoie les metadonnees, mais ne vide plus les slides.

## Déploiement sur Hugging Face Spaces (Gratuit / Docker)

L'application MediaCleaner utilise des librairies lourdes (OpenCV, EasyOCR). Elle ne tiendra jamais sur Vercel. Mais elle est **parfaitement configurée pour le Docker gratuit de Hugging Face**.

1. Créez un compte sur [Hugging Face Spaces](https://huggingface.co/spaces).
2. Cliquez sur **Create new Space**.
3. Choisissez **Docker** (Blank) en "Space SDK".
4. Liez ce dépôt GitHub, Hugging Face détectera automatiquement le `Dockerfile` !
5. Patientez pendant l'installation (jusqu'à 10 mins la première fois).
6. Le serveur sera accessible sur le port **7860**.
