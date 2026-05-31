#!/usr/bin/env python3
"""
scrape-shotgun.py — Scrape les events Toulouse depuis Shotgun.live
en interceptant les appels API internes du site.

SETUP (une seule fois) :
  python -m playwright install chromium

USAGE :
  python scripts/scrape-shotgun.py
  -> genere scripts/scraped-events.json
"""

import json
import re
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

# ─── CONFIG ──────────────────────────────────────────────────────────────────

SHOTGUN_URL  = "https://shotgun.live/fr/cities/toulouse/events"
MAX_EVENTS   = 60
SCROLL_TIMES = 5

CATEGORY_KEYWORDS = {
    "DJ Set":     ["dj", "dj set", "mix", "techno", "house", "electro", "rave", "club night"],
    "Concert":    ["concert", "live", "groupe", "band", "acoustique", "rock", "jazz", "rap"],
    "Happy Hour": ["happy hour", "happy-hour", "2 pour 1"],
    "Soiree":     ["soiree", "party", "fete", "nuit blanche"],
    "Brunch":     ["brunch"],
    "Expo":       ["expo", "exposition", "vernissage"],
    "Afterwork":  ["afterwork", "after work"],
}

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def detect_category(text):
    low = (text or "").lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in low for kw in keywords):
            return cat
    return "Soiree"

def parse_iso_date(s):
    if not s:
        return None, None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")
    except Exception:
        return s[:10] if len(s) >= 10 else None, None

def extract_from_api(data, events_out):
    """Parcourt recursivement un objet JSON pour trouver des events."""
    if isinstance(data, list):
        for item in data:
            extract_from_api(item, events_out)
    elif isinstance(data, dict):
        # Detecte un objet qui ressemble a un event
        title = data.get("name") or data.get("title")
        if title and isinstance(title, str) and len(title) > 2:
            date_raw  = data.get("startDate") or data.get("start_date") or data.get("date") or data.get("eventDate")
            date_iso, time_start = parse_iso_date(date_raw)

            # Lieu
            venue = None
            if isinstance(data.get("venue"), dict):
                venue = data["venue"].get("name")
            elif isinstance(data.get("location"), dict):
                venue = data["location"].get("name")
            if not venue:
                venue = data.get("venueName") or data.get("venue_name") or data.get("spot_name")

            # Photo
            photo_url = None
            if isinstance(data.get("cover"), dict):
                photo_url = data["cover"].get("url") or data["cover"].get("src")
            elif isinstance(data.get("image"), dict):
                photo_url = data["image"].get("url")
            if not photo_url:
                photo_url = data.get("coverUrl") or data.get("imageUrl") or data.get("photo_url")

            # Prix
            price = data.get("minPrice") or data.get("price") or data.get("ticketPrice")
            price_str = None
            if price and price != 0:
                price_str = str(price) + " EUR" if isinstance(price, (int, float)) else str(price)

            # Lien
            slug = data.get("slug") or data.get("id") or ""
            link = data.get("url") or ("https://shotgun.live/fr/events/" + str(slug) if slug else None)

            source_id = "shotgun_" + str(data.get("id") or data.get("slug") or title[:20])

            # Evite les doublons dans cette extraction
            if not any(e["source_id"] == source_id for e in events_out):
                ev = {
                    "title":        title,
                    "date":         date_iso,
                    "time_start":   time_start,
                    "category":     detect_category(title),
                    "description":  data.get("description") or data.get("shortDescription"),
                    "spot_name":    venue,
                    "quartier":     None,
                    "photo_url":    photo_url,
                    "featured":     data.get("featured") or data.get("isFeatured") or False,
                    "link":         link,
                    "price_detail": price_str,
                    "source_id":    source_id,
                }
                events_out.append(ev)

        # Continue a chercher en profondeur
        for v in data.values():
            if isinstance(v, (dict, list)):
                extract_from_api(v, events_out)

# ─── SCRAPER PRINCIPAL ───────────────────────────────────────────────────────

def scrape():
    api_responses = []
    events        = []

    with sync_playwright() as p:
        print("Lancement navigateur headless...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            )
        )
        page = context.new_page()

        # Intercepte toutes les reponses JSON
        def on_response(response):
            url = response.url
            ct  = response.headers.get("content-type", "")
            if "json" in ct and any(kw in url for kw in ["event", "city", "toulouse", "listing", "search"]):
                try:
                    body = response.json()
                    api_responses.append({"url": url, "data": body})
                    print("  API interceptee : " + url[:80])
                except Exception:
                    pass

        page.on("response", on_response)

        print("Ouverture Shotgun Toulouse...")
        page.goto(SHOTGUN_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)

        for i in range(SCROLL_TIMES):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)
            print("  Scroll " + str(i + 1) + "/" + str(SCROLL_TIMES) + "...")

        # Essaie aussi de lire __NEXT_DATA__ (Next.js SSR)
        try:
            next_data = page.evaluate("() => JSON.parse(document.getElementById('__NEXT_DATA__')?.textContent || 'null')")
            if next_data:
                print("  __NEXT_DATA__ trouve, extraction...")
                extract_from_api(next_data, events)
                print("  " + str(len(events)) + " events extraits de __NEXT_DATA__")
        except Exception as e:
            print("  Pas de __NEXT_DATA__ : " + str(e))

        browser.close()

    # Extrait les events des reponses API interceptees
    print("\n" + str(len(api_responses)) + " reponses API interceptees")
    for resp in api_responses:
        before = len(events)
        extract_from_api(resp["data"], events)
        added = len(events) - before
        if added:
            print("  +" + str(added) + " events depuis " + resp["url"][:60])

    return events

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    print("Scraping Shotgun Toulouse...\n")

    try:
        events = scrape()
    except Exception as e:
        print("ERREUR : " + str(e))
        return

    events = [e for e in events if e.get("title")]

    # Affiche un apercu
    print("\n--- Apercu des events trouves ---")
    for ev in events[:20]:
        print("[" + (ev["date"] or "?") + "] " + ev["title"][:50] + " [" + ev["category"] + "]")

    output = {
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "source":     "shotgun",
        "total":      len(events),
        "events":     events,
    }

    out_path = "scripts/scraped-events.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("\nOK - " + str(len(events)) + " events exportes dans " + out_path)
    if len(events) == 0:
        print("Aucun event trouve. Lance : python scripts/debug-shotgun-api.py")
    else:
        print("Prochaine etape : node scripts/import-events.mjs --dry-run")

if __name__ == "__main__":
    main()
