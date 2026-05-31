"""
Insère des événements réels Toulouse dans Supabase.
Usage : python scripts/add_events_toulouse.py

Les clés sont lues depuis .env.local (jamais hardcodées).
"""
import json
import os
import ssl
import uuid
import urllib.request

_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE

def _load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    env = {}
    with open(os.path.normpath(env_path), encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

_env = _load_env()
SUPABASE_URL = _env['VITE_SUPABASE_URL']
SERVICE_KEY  = _env['SUPABASE_SERVICE_KEY']

EVENTS = [
    # ── JUIN S1 ──────────────────────────────────────────────────────
    {
        "title": "Soirée House — Club Connexion",
        "category": "DJ Set",
        "spot_name": "Le Connexion Club",
        "quartier": "Capitole",
        "date": "2026-06-05",
        "time_start": "23:00",
        "time_end": "06:00",
        "price": "€",
        "price_detail": "8€ avant 00h / 12€ après",
        "description": "Le Connexion ouvre sa saison avec une nuit house pure : quatre heures de deep house et techno groovée dans le plus beau club de Toulouse.",
        "lineup": ["DJ Snatch", "Camelia b2b Theo B"],
        "featured": True,
    },
    {
        "title": "Happy Hour — Purple Bar",
        "category": "Happy Hour",
        "spot_name": "Purple Bar",
        "quartier": "Capitole",
        "date": "2026-06-05",
        "time_start": "18:00",
        "time_end": "21:00",
        "price": "€",
        "price_detail": "Cocktails 2 pour 1",
        "description": "Happy hour jusqu'à 21h avec cocktails maison à prix réduit. Ambiance détendue, terrasse ouverte.",
        "lineup": [],
        "featured": False,
    },
    {
        "title": "Nuit Techno — Le Rex Club",
        "category": "DJ Set",
        "spot_name": "Le Rex Club",
        "quartier": "Capitole",
        "date": "2026-06-06",
        "time_start": "00:00",
        "time_end": "07:00",
        "price": "€€",
        "price_detail": "15€ / gratuit liste avant 01h",
        "description": "Le Rex vous convie à une nuit techno avec des invités de la scène européenne. Soundsystem EV / Powersoft, lumières Robe.",
        "lineup": ["Rebekah", "Morah", "Dax J"],
        "featured": False,
    },
    {
        "title": "Brunch Jazz — Marché Victor Hugo",
        "category": "Brunch",
        "spot_name": "Marché Victor Hugo",
        "quartier": "Capitole",
        "date": "2026-06-07",
        "time_start": "10:30",
        "time_end": "14:00",
        "price": "€€",
        "price_detail": "Formule 22€ boisson incluse",
        "description": "Brunch dominical avec live jazz manouche au dernier étage du marché. Vues panoramiques, produits locaux du marché.",
        "lineup": ["Trio Velvet Swing"],
        "featured": False,
    },
    # ── JUIN S2 ──────────────────────────────────────────────────────
    {
        "title": "Concert — Fishbach",
        "category": "Concert",
        "spot_name": "Le Bikini",
        "quartier": "Ramonville",
        "date": "2026-06-12",
        "time_start": "20:30",
        "time_end": "23:30",
        "price": "€€",
        "price_detail": "22€ / 18€ abonné",
        "description": "Fishbach présente son dernier album dans la salle mythique de Ramonville. Pop baroque et voix envoûtante garanties.",
        "lineup": ["Fishbach"],
        "featured": True,
    },
    {
        "title": "Afterwork — Père Léon",
        "category": "Afterwork",
        "spot_name": "Le Père Léon",
        "quartier": "Saint-Cyprien",
        "date": "2026-06-12",
        "time_start": "18:30",
        "time_end": "22:00",
        "price": "Gratuit",
        "price_detail": "Entrée libre · conso à la carte",
        "description": "L'afterwork du jeudi avec playlist lounge et terrasse face aux Pyrénées. Bières locales Brasserie du Château et tapas.",
        "lineup": [],
        "featured": False,
    },
    {
        "title": "Nuit Drum & Bass — Le Rex Club",
        "category": "DJ Set",
        "spot_name": "Le Rex Club",
        "quartier": "Capitole",
        "date": "2026-06-13",
        "time_start": "23:00",
        "time_end": "06:00",
        "price": "€€",
        "price_detail": "12€ plein tarif",
        "description": "Une nuit entière dédiée au drum & bass avec les meilleurs selectors de la scène nationale. Jump up, liquid, neurofunk.",
        "lineup": ["Prolix", "Tantrum Desire", "Gydra"],
        "featured": False,
    },
    {
        "title": "Soirée Latino — O'Brazil",
        "category": "Soirée",
        "spot_name": "O'Brazil",
        "quartier": "Capitole",
        "date": "2026-06-14",
        "time_start": "22:00",
        "time_end": "05:00",
        "price": "€",
        "price_detail": "10€ tout inclus avant 23h",
        "description": "Salsa, bachata et kizomba toute la nuit. Cours de salsa offert en début de soirée à 22h.",
        "lineup": ["DJ Macarena", "Selecto Cubano"],
        "featured": False,
    },
    {
        "title": "Brunch & Vinyles — La Cave Poésie",
        "category": "Brunch",
        "spot_name": "La Cave Poésie",
        "quartier": "Capitole",
        "date": "2026-06-14",
        "time_start": "11:00",
        "time_end": "14:30",
        "price": "€€",
        "price_detail": "Formule 18€",
        "description": "Brunch avec sélection vinyle soul et funk des années 70-80. Vente de disques d'occasion sur place.",
        "lineup": ["DJ Frédéric P."],
        "featured": False,
    },
    # ── JUIN S3 ──────────────────────────────────────────────────────
    {
        "title": "Vernissage — Les Abattoirs",
        "category": "Expo",
        "spot_name": "Les Abattoirs",
        "quartier": "Saint-Cyprien",
        "date": "2026-06-17",
        "time_start": "18:30",
        "time_end": "22:00",
        "price": "Gratuit",
        "price_detail": "Entrée libre",
        "description": "Ouverture de la nouvelle exposition d'art contemporain 'Corps Étrangers'. Visite guidée, verre offert.",
        "lineup": [],
        "featured": False,
    },
    {
        "title": "Afterwork Rooftop — Hôtel Mercure",
        "category": "Afterwork",
        "spot_name": "Hôtel Mercure Wilson",
        "quartier": "Capitole",
        "date": "2026-06-18",
        "time_start": "18:00",
        "time_end": "22:00",
        "price": "Gratuit",
        "price_detail": "Consommations à partir de 8€",
        "description": "Le rooftop du Mercure en mode afterwork avec vue 360° sur Toulouse. DJ lounge ambiant.",
        "lineup": ["DJ Loulou"],
        "featured": False,
    },
    {
        "title": "Concert électro — Le Metronum",
        "category": "Concert",
        "spot_name": "Le Metronum",
        "quartier": "Borderouge",
        "date": "2026-06-19",
        "time_start": "20:00",
        "time_end": "23:30",
        "price": "€€",
        "price_detail": "18€ / 14€ adhérent",
        "description": "Soirée électronique live avec artistes de la scène européenne. Machines et synthés analogiques, concert assis/debout.",
        "lineup": ["Varg", "Cabaret Nocturne"],
        "featured": False,
    },
    {
        "title": "Nuit Garage — Le Florida",
        "category": "DJ Set",
        "spot_name": "Le Florida",
        "quartier": "Capitole",
        "date": "2026-06-20",
        "time_start": "22:30",
        "time_end": "05:00",
        "price": "€",
        "price_detail": "10€",
        "description": "UK Garage et 2-step avec une sélection exclusive. Sound de référence, piste pleine garantie.",
        "lineup": ["Nastia", "Héros Locaux"],
        "featured": False,
    },
    {
        "title": "Concert — Pomme",
        "category": "Concert",
        "spot_name": "Le Bikini",
        "quartier": "Ramonville",
        "date": "2026-06-20",
        "time_start": "20:00",
        "time_end": "23:00",
        "price": "€€",
        "price_detail": "25€ / 20€ réduit",
        "description": "Pomme en tournée avec son dernier album folk-pop. Voix cristalline, atmosphère intime dans la grande salle du Bikini.",
        "lineup": ["Pomme"],
        "featured": True,
    },
    # ── JUIN S4 ──────────────────────────────────────────────────────
    {
        "title": "Fête de la Musique — Place du Capitole",
        "category": "Concert",
        "spot_name": "Place du Capitole",
        "quartier": "Capitole",
        "date": "2026-06-21",
        "time_start": "16:00",
        "time_end": "02:00",
        "price": "Gratuit",
        "price_detail": "Gratuit — accès libre",
        "description": "La Fête de la Musique investit la place du Capitole avec une scène principale et des scènes secondaires dans tous les quartiers. 10 h de musique non-stop.",
        "lineup": ["Scène Capitole", "Scène Saint-Cyprien", "Scène Arnaud-Bernard"],
        "featured": True,
    },
    {
        "title": "Soirée Techno — Le Connexion Club",
        "category": "DJ Set",
        "spot_name": "Le Connexion Club",
        "quartier": "Capitole",
        "date": "2026-06-26",
        "time_start": "23:00",
        "time_end": "07:00",
        "price": "€€",
        "price_detail": "14€ / gratuit liste avant 00h30",
        "description": "Nuit techno industrielle avec artistes internationaux. Cinq heures de sets back-to-back dans le club le plus selectif de Toulouse.",
        "lineup": ["Blawan", "Shackleton", "Inhmost"],
        "featured": False,
    },
    {
        "title": "Happy Hour Jazz — Le Bar Saint-Aubin",
        "category": "Happy Hour",
        "spot_name": "Bar Saint-Aubin",
        "quartier": "Saint-Aubin",
        "date": "2026-06-26",
        "time_start": "18:00",
        "time_end": "21:00",
        "price": "€",
        "price_detail": "Pichets 7€ · Cocktails 2 pour 1",
        "description": "Happy hour hebdomadaire avec live jazz trio. Terrasse couverte, quartier des antiquaires.",
        "lineup": ["Jazz Trio Impromptu"],
        "featured": False,
    },
    # ── JUILLET ──────────────────────────────────────────────────────
    {
        "title": "Concert — Lomepal",
        "category": "Concert",
        "spot_name": "Zénith Toulouse Métropole",
        "quartier": "Purpan",
        "date": "2026-07-03",
        "time_start": "20:00",
        "time_end": "23:00",
        "price": "€€€",
        "price_detail": "35€ → 55€ selon catégorie",
        "description": "Lomepal en grande tournée au Zénith de Toulouse. Hip-hop introspectif, album 'Amiante' live avec orchestre.",
        "lineup": ["Lomepal"],
        "featured": True,
    },
    {
        "title": "Open Air — Île du Ramier",
        "category": "DJ Set",
        "spot_name": "Île du Ramier",
        "quartier": "Saint-Cyprien",
        "date": "2026-07-04",
        "time_start": "16:00",
        "time_end": "00:00",
        "price": "€",
        "price_detail": "12€ / gratuit avant 17h",
        "description": "Open air estival sur l'Île du Ramier avec six heures de musique électronique face à la Garonne. Foodtrucks, bar, coucher de soleil.",
        "lineup": ["Kresy", "Sofia Kourtesis", "Priori"],
        "featured": True,
    },
    {
        "title": "Brunch Rooftop — Terrasse Garonne",
        "category": "Brunch",
        "spot_name": "La Terrasse Garonne",
        "quartier": "Saint-Cyprien",
        "date": "2026-07-05",
        "time_start": "11:00",
        "time_end": "15:00",
        "price": "€€",
        "price_detail": "Formule 28€ tout compris",
        "description": "Brunch panoramique avec vue sur la Garonne et les briques roses. Buffet de produits locaux, jus frais, limonades artisanales.",
        "lineup": [],
        "featured": False,
    },
]


def insert_events(events):
    url = f"{SUPABASE_URL}/rest/v1/events"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body = json.dumps(events).encode("utf-8")
    req  = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=_ctx) as resp:
            print(f"OK — {resp.status} · {len(events)} événements insérés.")
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        print(f"ERREUR {e.code}: {detail}")


if __name__ == "__main__":
    events_with_ids = [{**e, "id": str(uuid.uuid4())} for e in EVENTS]
    print(f"Insertion de {len(events_with_ids)} événements Toulouse…")
    insert_events(events_with_ids)
