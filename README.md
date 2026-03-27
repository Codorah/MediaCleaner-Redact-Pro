---
title: Cleaner Pro
emoji: "🛡️"
colorFrom: red
colorTo: green
sdk: docker
app_port: 7860
fullWidth: true
---

# Cleaner Pro

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

Si `npm run dev` echoue sur Windows avec `spawn EPERM`, relance d'abord:

```bash
npm install
```

Le projet applique ensuite automatiquement un patch Vite via `postinstall` pour contourner le bug Windows lie a `net use`.

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

Si tu veux afficher un bouton de telechargement desktop dans le site, tu as deux options:

1. deposer un `.zip` ou un `.exe` dans `public/downloads/`
2. ou configurer une URL externe via `DESKTOP_DOWNLOAD_EXTERNAL_URL`

### Option 1: fichier local servi par l'application

1. depose ton fichier dans `public/downloads/`
2. rebuild le frontend avec `npm run build`

Exemple attendu:

```text
public/downloads/Cleaner_Pro.exe
```

Le site detectera automatiquement le `.exe` ou le `.zip` et activera la section de telechargement desktop.

### Option 2: lien externe vers le binaire

Configure les variables suivantes sur ton hebergeur:

```text
DESKTOP_DOWNLOAD_EXTERNAL_URL=https://.../Cleaner_Pro.exe
DESKTOP_DOWNLOAD_FILENAME=Cleaner_Pro.exe
DESKTOP_DOWNLOAD_NOTE=Telechargement officiel de la version desktop.
```

Cette approche est recommandee si tu veux pointer vers GitHub Releases ou un stockage de fichiers dedie.

## Securite renforcee

Le backend inclut maintenant:

- isolation des uploads dans des repertoires temporaires jetables
- purge automatique des repertoires temporaires trop anciens
- validation extension + type MIME
- limite de taille d'upload
- rate limiting par IP sur les routes sensibles
- `TrustedHostMiddleware` et en-tetes HTTP de securite
- logs de securite dans `data/security.log`
- hook antivirus optionnel via `MALWARE_SCANNER_PATH`

### Exemple de scan antivirus

Sur une machine avec ClamAV:

```text
MALWARE_SCANNER_PATH=/usr/bin/clamscan
MALWARE_SCANNER_ARGS=--no-summary --infected
```

Si tu veux une posture encore plus stricte, la meilleure approche reste l'usage local ou auto-heberge, avec stockage temporaire ephemere et scanner actif sur l'hote.

## API utile

- `GET /api/health`
- `GET /api/jobs`
- `POST /api/process`

## Notes

- La base SQLite est stockee dans `data/mediacleaner.db`.
- Les modeles OCR sont stockes dans `.models/`.
- Le mode `Masquer le texte visible` est plus lent.
- Sur `.pptx`, le backend optimise les medias embarques et nettoie les metadonnees, mais ne vide plus les slides.
- Le backend applique des limites d'upload, des en-tetes de securite, une validation MIME de base, un controle d'hote et un rate limiting simple sur les routes sensibles.
- Pour Render, utilise `ALLOWED_HOSTS=127.0.0.1,localhost,*.onrender.com`.
