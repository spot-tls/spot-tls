#!/usr/bin/env python3
"""
scrape-events.py — Scrape les events Facebook des bars/clubs Toulouse
et les exporte en JSON prêt pour Supabase.

SETUP (une seule fois) :
  1. Va sur https://developers.facebook.com/
  2. Crée une App (type: Consumer ou Business)
  3. Va dans Tools > Graph API Explorer
  4. Génère un User Token avec la permission : pages_read_engagement
  5. Copie le token dans FACEBOOK_TOKEN ci-dessous
  6. Pour prolonger le token : https://developers.facebook.com/tools/debug/accesstoken/

USAGE :
  python3 scripts/scrape-events.py
  -> génère scripts/scraped-events.json

PUIS importer dans Supabase :
  node scripts/import-events.mjs
"""

import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# ─── CONFIG ──────────────────────────────────────────────────────────────────

FACEBOOK_TOKEN = "TON_ACCESS_TOKEN_ICI"  # <-- colle ton token ici

# Page IDs des bars/clubs Toulouse à suivre
# Pour trouver le Page ID d'une page FB :
#   - Va sur la page, ouvre About / A propos
#   - Ou utilise : https://lookup-id.com/
#   - Ou dans l'URL si numérique : facebook.com/123456789

PAGES = [
    {"id": "REMPLACE_PAR_PAGE_ID", "spot_name": "Le Bikini",         "quartier": "Toulouse"},
    {"id": "REMPLACE_PAR_PAGE_ID", "spot_name": "La Dynamo",         "quartier": "Toulouse"},
    {"id": "REMPLACE_PAR_PAGE_ID", "spot_name": "Le Metronum",       "quartier": "Toulouse"},
    # Ajoute autant de pages que tu veux
]

# Catégorie par défaut si pas détectée
DEFAULT_CATEGORY = "Concert"

# Mapping mots-clés → catégorie Spot
CATEGORY_KEYWORDS = {
    "DJ Set":     ["dj", "dj set", "mix", "techno", "house", "electro"],
    "Concert":    ["concert", "live", "groupe", "band", "acoustique"],
    "Happy Hour": ["happy hour", "happy-hour", "hh ", "2 pour 1"],
    "Soirée":     ["soiree", "soirée", "party", "fête", "nuit blanche"],
    "Brunch":     ["brunch", "brunch musical"],
    "Expo":       ["expo", "exposition", "vernissage", "art"],
    "Afterwork":  ["afterwork", "after work", "after-work"],
}

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def fb_get(endpoint, params):
    """Appel Graph API Facebook."""
    params["access_token"] = FACEBOOK_TOKEN
    url = f"https://graph.facebook.com/v19.0/{endpoint}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  Erreur API : {e}")
        return None

def detect_category(text):
    """Détecte la catégorie depuis le titre/description."""
    low = (text or "").lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in low for kw in keywords):
            return cat
    return DEFAULT_CATEGORY

def parse_fb_time(fb_time):
    """Parse une date FB ISO en date + heure locales."""
    if not fb_time:
        return None, None
    try:
        # FB renvoie : 2024-11-30T21:00:00+0100
        dt = datetime.fromisoformat(fb_time.replace("+0000", "+00:00"))
        dt_local = dt.astimezone()
        return dt_local.strftime("%Y-%m-%d"), dt_local.strftime("%H:%M")
    except Exception:
        return fb_time[:10], None

def fetch_page_events(page):
    """Fetch les events d'une page Facebook."""
    fields = "id,name,description,start_time,end_time,cover,place"
    data = fb_get(f"{page['id']}/events", {
        "fields": fields,
        "limit": 20,
        "time_filter": "upcoming",
    })
    if not data or "data" not in data:
        print(f"  Aucun event ou erreur pour {page['spot_name']}")
        return []

    events = []
    for ev in data["data"]:
        date, time_start = parse_fb_time(ev.get("start_time"))
        _, time_end      = parse_fb_time(ev.get("end_time"))

        # Photo de couverture
        photo_url = None
        if ev.get("cover"):
            photo_url = ev["cover"].get("source")

        # Catégorie auto-détectée
        category = detect_category(ev.get("name", "") + " " + ev.get("description", ""))

        event = {
            "title":        ev.get("name"),
            "date":         date,
            "time_start":   time_start,
            "time_end":     time_end,
            "category":     category,
            "description":  ev.get("description", "")[:500] if ev.get("description") else None,
            "spot_name":    page["spot_name"],
            "quartier":     page.get("quartier"),
            "photo_url":    photo_url,
            "source":       "facebook",
            "source_id":    ev.get("id"),
            "featured":     False,
            "link":         f"https://facebook.com/events/{ev.get('id')}",
        }
        events.append(event)
        print(f"    -> {ev.get('name')} [{date}] [{category}]")

    return events

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    if FACEBOOK_TOKEN == "TON_ACCESS_TOKEN_ICI":
        print("ERREUR : Remplis FACEBOOK_TOKEN dans le script !")
        print("  -> https://developers.facebook.com/tools/explorer/")
        return

    print(f"Scraping {len(PAGES)} pages Facebook...
")

    all_events = []
    errors     = []

    for page in PAGES:
        if page["id"] == "REMPLACE_PAR_PAGE_ID":
            print(f"  Skipping {page['spot_name']} (pas de Page ID)")
            continue
        print(f"[{page['spot_name']}]")
        try:
            events = fetch_page_events(page)
            all_events.extend(events)
            print(f"  {len(events)} events trouvés")
        except Exception as e:
            errors.append({"page": page["spot_name"], "error": str(e)})
            print(f"  ERREUR : {e}")

    # Déduplique par source_id
    seen = set()
    unique_events = []
    for ev in all_events:
        key = ev.get("source_id") or ev.get("title")
        if key not in seen:
            seen.add(key)
            unique_events.append(ev)

    # Trie par date
    unique_events.sort(key=lambda e: e.get("date") or "")

    output = {
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "total":      len(unique_events),
        "events":     unique_events,
        "errors":     errors,
    }

    out_path = "scripts/scraped-events.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"
✓ {len(unique_events)} events exportés dans {out_path}")
    if errors:
        print(f"  {len(errors)} erreurs : {[e['page'] for e in errors]}")

if __name__ == "__main__":
    main()
