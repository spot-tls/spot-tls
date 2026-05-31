# Photos — Setup & Sync

## 1. Prérequis Supabase

### Bucket Storage "spot-photos"
Si le bucket n'existe pas encore, exécuter dans **Supabase → Storage → New bucket** :
- Name : `spot-photos`
- Public : ✅ (les URLs doivent être accessibles sans auth)

Ou via SQL Editor :
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-photos', 'spot-photos', true)
ON CONFLICT DO NOTHING;
```

### Politique RLS Storage (lecture publique + écriture service role)
```sql
-- Lecture publique
CREATE POLICY "Public read spot-photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'spot-photos' );

-- Upload via service role seulement (admin)
CREATE POLICY "Service role upload spot-photos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'spot-photos' );
```

### Colonne place_id (optionnelle mais recommandée pour la sync)
```sql
ALTER TABLE spots ADD COLUMN IF NOT EXISTS place_id TEXT;
CREATE INDEX IF NOT EXISTS spots_place_id_idx ON spots(place_id);
```

---

## 2. Upload admin (in-app)

Disponible dans **Mode admin → SpotDetail → ✏️ Modifier → section Photos**.

- Bouton "📷 Ajouter une photo" → galerie mobile
- Upload direct vers `spot-photos/spots/{id}/{timestamp}.ext`
- URL publique ajoutée à `photos[]` du spot
- Les photos existantes sont affichées en grille avec bouton ×

---

## 3. Sync Google Places (script)

```bash
# Installer les deps si pas déjà fait
npm install

# Créer .env.local à la racine
echo "GOOGLE_API_KEY=AIza..." >> .env.local
echo "SUPABASE_URL=https://nnxuewtauidiwrvxjbtr.supabase.co" >> .env.local
echo "SUPABASE_SERVICE_KEY=eyJ..." >> .env.local

# Test sans écriture (recommandé d'abord)
node --experimental-vm-modules scripts/sync-google-photos.js --dry-run

# Remplir les place_id manquants
node scripts/sync-google-photos.js --find-place-ids

# Sync photos pour tous les spots sans photos[]
node scripts/sync-google-photos.js
```

Le script :
1. Charge tous les spots Supabase avec `photos[]` vide
2. Cherche leur `place_id` Google Places si manquant (Text Search par nom + Toulouse)
3. Récupère jusqu'à 5 photos par spot via Place Details
4. Résout les URLs CDN réelles (suivi des redirects Google)
5. Écrit dans `spots.photos[]`

**Clé API Google requise** : activer "Places API" dans Google Cloud Console.
