from flask import Flask, request, jsonify, send_from_directory, send_file
import json
import os
import requests
from PIL import Image
import io
import re
import shutil
from werkzeug.utils import secure_filename

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "frontend"))
IMAGES_DIR = os.path.join(BASE_DIR, "images")
DOWNLOADS_DIR = os.path.join(BASE_DIR, "images_downloads")
THUMB_CACHE_DIR = os.path.join(IMAGES_DIR, "_thumbs")

app = Flask(__name__, static_folder=None)

DATA_FILE = os.path.join(BASE_DIR, "data", "media.json")
COLLECTIONS_FILE = os.path.join(BASE_DIR, "data", "collections.json")

# Ensure base directories exist on startup so they're visible immediately
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)
os.makedirs(os.path.join(DOWNLOADS_DIR, "games"), exist_ok=True)
os.makedirs(os.path.join(DOWNLOADS_DIR, "movies"), exist_ok=True)
os.makedirs(os.path.join(DOWNLOADS_DIR, "series"), exist_ok=True)
os.makedirs(THUMB_CACHE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(COLLECTIONS_FILE), exist_ok=True)
if not os.path.exists(COLLECTIONS_FILE):
    with open(COLLECTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump({"collections": []}, f, indent=2, ensure_ascii=False)

def _normalize_item(item: dict) -> dict:
    # Ensure newly added keys exist
    if "discovered" not in item:
        item["discovered"] = ""
    if "spielzeit" not in item:
        # store minutes as integer or null
        item["spielzeit"] = None
    if "isAiring" not in item:
        item["isAiring"] = False
    if "nextSeason" not in item:
        item["nextSeason"] = None
    if "nextSeasonRelease" not in item:
        item["nextSeasonRelease"] = ""
    if "id" not in item:
        # Generate unique ID based on title, category, and release date
        import hashlib
        import time
        unique_string = f"{item.get('title', '')}_{item.get('category', '')}_{item.get('release', '')}_{time.time()}"
        item["id"] = hashlib.md5(unique_string.encode()).hexdigest()[:12]
    return item

def _load_and_normalize_data(write_back: bool = True):
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        changed = False
        if isinstance(data, list):
            for idx in range(len(data)):
                before = dict(data[idx]) if isinstance(data[idx], dict) else data[idx]
                data[idx] = _normalize_item(data[idx])
                if data[idx] != before:
                    changed = True
        if write_back and changed:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        return data
    except Exception:
        return []

# API Keys (hier eintragen!)
TMDB_API_KEY = "3d642e625f07169289ec5f825dba5e20"
RAWG_API_KEY = "49dea73fbf98426bad23cb356c659287"

# Sicherstellen, dass die JSON-Datei existiert
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, indent=2)

def sanitize_filename(name: str) -> str:
    safe = ''.join(ch for ch in (name or '') if ch.isalnum() or ch in (' ', '-', '_', '.')).strip()
    return (safe or 'item').replace(' ', '_')

def save_image_normalized(url: str, rel_path_without_ext: str) -> str:
    """Download image from url, validate via Pillow, determine extension, save under resolved path.
    Returns final relative path (with extension) on success, raises on failure."""
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    content = r.content
    if not content or len(content) < 200:
        raise ValueError("empty or invalid image content")
    try:
        im = Image.open(io.BytesIO(content))
        im.load()
    except Exception as e:
        raise ValueError(f"invalid image: {e}")
    fmt = (im.format or "JPEG").upper()
    ext = ".jpg" if fmt in ("JPG", "JPEG") else ".png" if fmt == "PNG" else ".webp" if fmt == "WEBP" else ".jpg"
    # ensure rel path has extension
    if rel_path_without_ext.lower().endswith(('.jpg','.jpeg','.png','.webp')):
        final_rel = rel_path_without_ext
    else:
        final_rel = rel_path_without_ext + ext
    fs_path = _resolve_image_fs_path(final_rel)
    os.makedirs(os.path.dirname(fs_path), exist_ok=True)
    if fmt in ("JPG", "JPEG", "WEBP"):
        im = im.convert("RGB")
    im.save(fs_path, format="WEBP" if ext == ".webp" else ("JPEG" if ext == ".jpg" else "PNG"), quality=90)
    return final_rel

@app.route("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)

@app.route("/images_downloads/<path:filename>")
def serve_image_downloads(filename):
    return send_from_directory(DOWNLOADS_DIR, filename)

def _resolve_image_fs_path(rel_path: str) -> str:
    # Unterstützt Pfade wie "images/movies/x.jpg" oder Legacy "movies/x.jpg"
    normalized = rel_path.replace("\\", "/")
    if os.path.isabs(normalized):
        return normalized
    if normalized.startswith("images_downloads/"):
        rel_under_downloads = normalized[len("images_downloads/"):]
        fs_path = os.path.normpath(os.path.join(DOWNLOADS_DIR, rel_under_downloads))
    elif normalized.startswith("images/"):
        rel_under_images = normalized[len("images/"):]
        fs_path = os.path.normpath(os.path.join(IMAGES_DIR, rel_under_images))
    else:
        fs_path = os.path.normpath(os.path.join(IMAGES_DIR, normalized))
    return fs_path

@app.route("/thumb")
def thumbnail():
    # Query: path (required), w (default 300), h (optional), q (default 80), fmt (jpg|webp, default jpg)
    rel_path = request.args.get("path")
    if not rel_path:
        return jsonify({"success": False, "error": "path required"}), 400
    try:
        width = int(request.args.get("w", 300))
        height = request.args.get("h")
        height = int(height) if height else None
        quality = int(request.args.get("q", 80))
        fmt = request.args.get("fmt", "jpg").lower()
        if fmt not in ("jpg", "jpeg", "webp"):
            fmt = "jpg"
    except Exception:
        return jsonify({"success": False, "error": "invalid params"}), 400

    src_path = _resolve_image_fs_path(rel_path)
    if not os.path.exists(src_path):
        return jsonify({"success": False, "error": "source not found"}), 404

    # Cache-Pfad
    size_key = f"{width}x{height if height else 0}_{quality}_{fmt}"
    cache_path = os.path.normpath(os.path.join(THUMB_CACHE_DIR, size_key, rel_path.replace("\\", "/")))
    cache_dir = os.path.dirname(cache_path)
    os.makedirs(cache_dir, exist_ok=True)

    # Regenerieren wenn Quelle neuer ist oder Cache fehlt
    try:
        src_mtime = os.path.getmtime(src_path)
        needs_regen = True
        if os.path.exists(cache_path):
            cache_mtime = os.path.getmtime(cache_path)
            needs_regen = cache_mtime < src_mtime
        if needs_regen:
            with Image.open(src_path) as im:
                im = im.convert("RGB")
                if width and height:
                    im.thumbnail((width, height), Image.LANCZOS)
                else:
                    im.thumbnail((width, width), Image.LANCZOS)
                save_kwargs = {"quality": quality}
                if fmt == "webp":
                    save_kwargs["method"] = 6
                os.makedirs(os.path.dirname(cache_path), exist_ok=True)
                im.save(cache_path, format="WEBP" if fmt == "webp" else "JPEG", **save_kwargs)
    except Exception as e:
        # Fallback: sende Original (besser als 500)
        try:
            return send_file(src_path)
        except Exception:
            return jsonify({"success": False, "error": str(e)}), 500

    mimetype = "image/webp" if fmt == "webp" else "image/jpeg"
    return send_file(cache_path, mimetype=mimetype)

def _extract_tmdb_id_from_link(link: str) -> str | None:
    if not link:
        return None
    try:
        m = re.search(r"themoviedb\.org/(?:tv|movie)/(\d+)", link)
        if m:
            return m.group(1)
    except Exception:
        pass
    return None

def _tmdb_get_series_details_by_id(tmdb_id: str) -> dict | None:
    try:
        url = f"https://api.themoviedb.org/3/tv/{tmdb_id}?api_key={TMDB_API_KEY}"
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception:
        return None
    return None

def _tmdb_find_series_details_by_title(title: str) -> dict | None:
    try:
        s_url = f"https://api.themoviedb.org/3/search/tv?api_key={TMDB_API_KEY}&query={requests.utils.quote(title)}"
        r = requests.get(s_url, timeout=15)
        if r.status_code != 200:
            return None
        data = r.json()
        if not data.get("results"):
            return None
        # Prefer exact name match (case-insensitive), else first result
        results = data["results"]
        exact = next((x for x in results if (x.get("name") or "").lower() == title.lower()), None)
        chosen = exact or results[0]
        return _tmdb_get_series_details_by_id(str(chosen.get("id")))
    except Exception:
        return None

@app.route("/maintenance/update-series-genres")
def maintenance_update_series_genres():
    dry_run = request.args.get("dry_run", "1") not in ("0", "false", "False")
    data = _load_and_normalize_data(write_back=False)
    updated = 0
    checked = 0
    errors = 0
    for item in data:
        try:
            if not isinstance(item, dict):
                continue
            if item.get("category") != "series":
                continue
            checked += 1
            details = None
            tmdb_id = _extract_tmdb_id_from_link(item.get("link", ""))
            if tmdb_id:
                details = _tmdb_get_series_details_by_id(tmdb_id)
            if details is None:
                # fallback by title
                title = item.get("title") or ""
                if title:
                    details = _tmdb_find_series_details_by_title(title)
            if not details:
                continue
            api_genres = [g.get("name") for g in details.get("genres", []) if isinstance(g, dict) and g.get("name")]
            # build new genre list
            new_genres = list(api_genres)
            if any((g or "").lower() == "animation" for g in api_genres):
                if not any((g or "").lower() == "anime" for g in new_genres):
                    new_genres.append("Anime")
            # stringify
            new_genre_str = ", ".join(new_genres)
            if (item.get("genre") or "") != new_genre_str:
                item["genre"] = new_genre_str
                updated += 1
        except Exception:
            errors += 1
            continue
    if not dry_run:
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            return jsonify({"success": False, "error": str(e), "checked": checked, "updated": updated, "errors": errors}), 500
    return jsonify({"success": True, "dry_run": dry_run, "checked": checked, "updated": updated, "errors": errors})

@app.route('/list-images')
def list_images():
    # List images from IMAGES_DIR and DOWNLOADS_DIR (relative paths)
    result=[]
    for base, root_dir in (("images", IMAGES_DIR), ("images_downloads", DOWNLOADS_DIR)):
        for dirpath, _, files in os.walk(root_dir):
            for fname in files:
                if fname.lower().endswith(('.jpg','.jpeg','.png','.webp')):
                    rel = os.path.relpath(os.path.join(dirpath, fname), root_dir).replace('\\','/')
                    result.append(f"{base}/{rel}")
    result.sort()
    return jsonify({"success": True, "images": result})

@app.route('/copy-image', methods=['POST'])
def copy_image():
    try:
        data = request.get_json()
        src = data.get('src')
        dst = data.get('dst')
        if not src or not dst:
            return jsonify({"success": False, "error": "src and dst required"}), 400
        src_fs = _resolve_image_fs_path(src)
        dst_fs = _resolve_image_fs_path(dst)
        if not os.path.exists(src_fs):
            return jsonify({"success": False, "error": "source not found"}), 404
        os.makedirs(os.path.dirname(dst_fs), exist_ok=True)
        shutil.copy2(src_fs, dst_fs)
        return jsonify({"success": True, "saved": dst})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "no file"}), 400
        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({"success": False, "error": "empty filename"}), 400
        dst = request.form.get('dst', '')
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
            return jsonify({"success": False, "error": "unsupported file type"}), 400
        # default destination if not provided
        if not dst:
            dst = f"images_downloads/uploads/{filename}"
        # ensure extension
        root, current_ext = os.path.splitext(dst)
        if not current_ext:
            dst = root + ext
        fs_path = _resolve_image_fs_path(dst)
        os.makedirs(os.path.dirname(fs_path), exist_ok=True)
        file.save(fs_path)
        return jsonify({"success": True, "saved": dst})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def _load_collections():
    try:
        with open(COLLECTIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"collections": []}

def _save_collections(data: dict):
    with open(COLLECTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/collections', methods=['GET'])
def get_collections():
    return jsonify(_load_collections())

@app.route('/collections', methods=['POST'])
def post_collections():
    try:
        data = request.get_json()
        if not isinstance(data, dict) or 'collections' not in data:
            return jsonify({"success": False, "error": "invalid payload"}), 400
        _save_collections(data)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# Legacy image paths for existing entries
@app.route("/games/<path:filename>")
def serve_legacy_games(filename):
    return send_from_directory(os.path.join(IMAGES_DIR, "games"), filename)

@app.route("/movies/<path:filename>")
def serve_legacy_movies(filename):
    return send_from_directory(os.path.join(IMAGES_DIR, "movies"), filename)

@app.route("/series/<path:filename>")
def serve_legacy_series(filename):
    return send_from_directory(os.path.join(IMAGES_DIR, "series"), filename)

@app.route("/media_relative.json", methods=["GET"])
def get_data():
    data = _load_and_normalize_data(write_back=True)
    return jsonify(data)

@app.route("/media_relative.json", methods=["POST"])
def save_data():
    try:
        data = request.get_json()
        # normalize incoming data too
        if isinstance(data, list):
            data = [_normalize_item(item) for item in data]
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/fetch-api", methods=["POST"])
def fetch_api():
    req = request.get_json()
    title_or_id = req.get("title")
    category = req.get("category")

    if not title_or_id or not category:
        return jsonify({"success": False, "error": "Titel oder Kategorie fehlt"})

    result = None

    try:
        if category == "game":
            # RAWG API unverändert
            url = f"https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={title_or_id}"
            r = requests.get(url)
            data = r.json()
            if data.get("results"):
                game = data["results"][0]
                safe_name = sanitize_filename(game.get('name'))
                rel_base = f"images_downloads/games/{safe_name}"
                result = {
                    "title": game.get("name"),
                    "release": game.get("released"),
                    "platforms": ", ".join([p["platform"]["name"] for p in game.get("platforms", [])]),
                    "genre": ", ".join([g["name"] for g in game.get("genres", [])]),
                    "link": f"https://rawg.io/games/{game.get('slug')}",
                    "path": rel_base
                }
                img_url = game.get("background_image")
                if img_url:
                    try:
                        result["path"] = save_image_normalized(img_url, rel_base)
                    except Exception as e:
                        print("Fehler beim Bild-Download (RAWG):", e)
                debug = {
                    "source": "rawg",
                    "raw": game,
                    "extra": {
                        "metacritic": game.get("metacritic"),
                        "esrb_rating": (game.get("esrb_rating") or {}).get("name"),
                        "ratings_count": game.get("ratings_count"),
                    }
                }

        else:
            # TMDb (Movies & Series)
            search_type = "movie" if category == "movie" else "tv"
            tmdb_id = None

            # Prüfen: nur Zahlen → ID, sonst suchen
            if str(title_or_id).isdigit():
                tmdb_id = str(title_or_id)
            else:
                # Suche nach Titel via TMDb
                search_url = f"https://api.themoviedb.org/3/search/{search_type}?api_key={TMDB_API_KEY}&query={requests.utils.quote(title_or_id)}"
                r = requests.get(search_url, timeout=15).json()
                if r.get("results"):
                    # bevorzugt exakter Name
                    exact = next((x for x in r["results"] if (x.get("title") or x.get("name") or "").lower() == title_or_id.lower()), None)
                    chosen = exact or r["results"][0]
                    tmdb_id = str(chosen.get("id"))

            if not tmdb_id:
                return jsonify({"success": False, "error": "TMDb-ID konnte nicht ermittelt werden"})

            # Details abrufen
            details_url = f"https://api.themoviedb.org/3/{search_type}/{tmdb_id}?api_key={TMDB_API_KEY}"
            d = requests.get(details_url, timeout=15).json()
            name = d.get("title") or d.get("name")
            safe_name = sanitize_filename(name)
            rel_base = f"images_downloads/{'movies' if category == 'movie' else 'series'}/{safe_name}"
            result = {
                "title": name,
                "release": d.get("release_date") or d.get("first_air_date"),
                "platforms": "",
                "genre": ", ".join([g.get("name") for g in d.get("genres", [])]),
                "link": f"https://www.themoviedb.org/{search_type}/{tmdb_id}",
                "path": rel_base
            }

            if d.get("poster_path"):
                img_url = f"https://image.tmdb.org/t/p/w500{d['poster_path']}"
                try:
                    result["path"] = save_image_normalized(img_url, rel_base)
                except Exception as e:
                    print("Fehler beim Bild-Download (TMDb):", e)
            debug = {"source": "tmdb", "details": d}

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    payload = {"success": True, "data": result}
    if 'debug' in locals():
        payload["debug"] = debug
    return jsonify(payload)

@app.route("/api/search", methods=["GET"])
def api_search():
    """Search for media items via external APIs"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        
        if not query or len(query) < 2:
            return jsonify([])
        
        results = []
        
        # Search TMDB for movies and TV shows
        try:
            # Search movies
            movie_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={requests.utils.quote(query)}&page=1"
            movie_response = requests.get(movie_url, timeout=10).json()
            
            for item in movie_response.get('results', [])[:limit//2]:
                results.append({
                    'id': f"tmdb_movie_{item['id']}",
                    'title': item['title'],
                    'release': item.get('release_date', ''),
                    'image': f"https://image.tmdb.org/t/p/w200{item.get('poster_path', '')}" if item.get('poster_path') else '',
                    'category': 'movie',
                    'overview': item.get('overview', ''),
                    'rating': round(item.get('vote_average', 0), 1),
                    'api_source': 'tmdb'
                })
            
            # Search TV shows
            tv_url = f"https://api.themoviedb.org/3/search/tv?api_key={TMDB_API_KEY}&query={requests.utils.quote(query)}&page=1"
            tv_response = requests.get(tv_url, timeout=10).json()
            
            for item in tv_response.get('results', [])[:limit//2]:
                results.append({
                    'id': f"tmdb_tv_{item['id']}",
                    'title': item['name'],
                    'release': item.get('first_air_date', ''),
                    'image': f"https://image.tmdb.org/t/p/w200{item.get('poster_path', '')}" if item.get('poster_path') else '',
                    'category': 'series',
                    'overview': item.get('overview', ''),
                    'rating': round(item.get('vote_average', 0), 1),
                    'api_source': 'tmdb'
                })
                
        except Exception as e:
            print(f"TMDB search error: {e}")
        
        # Search RAWG for games
        try:
            game_url = f"https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={requests.utils.quote(query)}&page_size={limit//3}"
            game_response = requests.get(game_url, timeout=10).json()
            
            for item in game_response.get('results', [])[:limit//3]:
                results.append({
                    'id': f"rawg_game_{item['id']}",
                    'title': item['name'],
                    'release': item.get('released', ''),
                    'image': item.get('background_image', ''),
                    'category': 'games',
                    'overview': item.get('description_raw', ''),
                    'rating': round(item.get('rating', 0), 1),
                    'api_source': 'rawg'
                })
                
        except Exception as e:
            print(f"RAWG search error: {e}")
        
        # Sort by relevance (rating) and limit results
        results.sort(key=lambda x: x['rating'], reverse=True)
        return jsonify(results[:limit])
        
    except Exception as e:
        print(f"Search API error: {e}")
        return jsonify([])

# Statische Dateien
@app.route("/<path:path>")
def static_proxy(path):
    # Frontend files (HTML/CSS/JS)
    return send_from_directory(FRONTEND_DIR, path)
@app.route("/delete-image", methods=["POST"])
def delete_image():
    try:
        data = request.get_json()
        path = data.get("path")  # Pfad vom Bild (z.B. images/movies/foo.jpg)
        if path:
            # Einheitliche Auflösung (unterstützt images/ und images_downloads/ sowie Legacy)
            fs_path = _resolve_image_fs_path(path)
            if os.path.exists(fs_path):
                os.remove(fs_path)
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "Datei nicht gefunden"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/download-image", methods=["POST"])
def download_image_endpoint():
    try:
        data = request.get_json()
        url = data.get("url")
        path = data.get("path")  # expected like images/movies/name.jpg
        if not url or not path:
            return jsonify({"success": False, "error": "url and path required"}), 400
        fs_path = _resolve_image_fs_path(path)
        os.makedirs(os.path.dirname(fs_path), exist_ok=True)
        r = requests.get(url, stream=True, timeout=20)
        if r.status_code != 200:
            return jsonify({"success": False, "error": f"status {r.status_code}"}), 400
        # Read full content to verify
        content = b"".join(r.iter_content(1024))
        if not content or len(content) < 200:  # tiny responses -> probably invalid
            return jsonify({"success": False, "error": "leerer oder ungültiger Bildinhalt"}), 400
        # Validate image by opening with Pillow
        try:
            im = Image.open(io.BytesIO(content))
            im.load()
        except Exception:
            return jsonify({"success": False, "error": "kein gültiges Bild"}), 400
        # Determine extension by format
        fmt = (im.format or "JPEG").upper()
        ext = ".jpg" if fmt in ("JPG", "JPEG") else ".png" if fmt == "PNG" else ".webp" if fmt == "WEBP" else ".jpg"
        root, current_ext = os.path.splitext(fs_path)
        if not current_ext:
            fs_path = root + ext
            path = os.path.splitext(path)[0] + ext
        # Save normalized image (convert to RGB for jpeg/webp)
        try:
            if fmt in ("JPG", "JPEG", "WEBP"):
                im = im.convert("RGB")
            im.save(fs_path, format="WEBP" if ext == ".webp" else ("JPEG" if ext == ".jpg" else "PNG"), quality=90)
        except Exception as e:
            return jsonify({"success": False, "error": f"Speichern fehlgeschlagen: {str(e)}"}), 500
        size = os.path.getsize(fs_path)
        return jsonify({"success": True, "saved": path, "bytes": size})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/")
def root():
    return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    app.run(debug=True)
