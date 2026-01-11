import os
import random
import subprocess
from math import cos, radians

import requests

# --- Settings ---
OUT_DIR = "pr_s2_tiles"
N_TILES = 5
WIDTH = 1000
HEIGHT = 1000

# "Drone-like" feel: choose a ~1 km x 1 km area per tile at 100x100 px (~10 m/px).
TILE_SIZE_M = 500

# Puerto Rico rough bounding box (lon, lat)
PR_MIN_LON, PR_MAX_LON = -67.95, -65.22
PR_MIN_LAT, PR_MAX_LAT = 17.88, 18.52

# EOX Sentinel-2 Cloudless WMS (global mosaic)
# Endpoint pattern used widely (works in apps like JOSM; EOX publishes endpoints for WMTS/WMS).
WMS_BASE = "https://tiles.maps.eox.at/"

# Layer names:
# For EPSG:4326, many clients use: s2cloudless-YYYY (example shown for 2020).
# If your request errors, try s2cloudless-2024_3857 with EPSG:3857 (Option 2 below).
LAYER_4326 = "s2cloudless-2024"

os.makedirs(OUT_DIR, exist_ok=True)

def meters_to_degrees(lat_deg, meters):
    # Approx conversions around given latitude
    deg_lat = meters / 111_320.0
    deg_lon = meters / (111_320.0 * cos(radians(lat_deg)))
    return deg_lon, deg_lat

def wms_getmap_4326(bbox, width, height, out_path):
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "VERSION": "1.1.1",
        "LAYERS": LAYER_4326,
        "STYLES": "",
        "SRS": "EPSG:4326",
        "BBOX": ",".join(f"{v:.8f}" for v in bbox),
        "WIDTH": str(width),
        "HEIGHT": str(height),
        "FORMAT": "image/jpeg",
    }
    r = requests.get(WMS_BASE, params=params, timeout=30)
    r.raise_for_status()
    with open(out_path, "wb") as f:
        f.write(r.content)

def write_exif_gps(jpeg_path, lat, lon):
    lat_ref = "N" if lat >= 0 else "S"
    lon_ref = "E" if lon >= 0 else "W"
    # ExifTool accepts decimal degrees and writes proper EXIF GPS tags.  [oai_citation:2‡exiftool.org](https://exiftool.org/TagNames/GPS.html?utm_source=chatgpt.com)
    cmd = [
        "exiftool",
        "-overwrite_original",
        f"-GPSLatitude={abs(lat)}",
        f"-GPSLatitudeRef={lat_ref}",
        f"-GPSLongitude={abs(lon)}",
        f"-GPSLongitudeRef={lon_ref}",
        "-GPSMapDatum=WGS-84",
        jpeg_path,
    ]
    subprocess.run(cmd, check=True)

for i in range(1, N_TILES + 1):
    # Pick a random center point in Puerto Rico
    center_lat = random.uniform(PR_MIN_LAT, PR_MAX_LAT)
    center_lon = random.uniform(PR_MIN_LON, PR_MAX_LON)

    deg_lon, deg_lat = meters_to_degrees(center_lat, TILE_SIZE_M / 2)
    min_lon = center_lon - deg_lon
    max_lon = center_lon + deg_lon
    min_lat = center_lat - deg_lat
    max_lat = center_lat + deg_lat

    bbox = (min_lon, min_lat, max_lon, max_lat)

    out_file = os.path.join(OUT_DIR, f"PR_S2_{i:02d}_{center_lat:.5f}_{center_lon:.5f}.jpg")
    wms_getmap_4326(bbox, WIDTH, HEIGHT, out_file)
    write_exif_gps(out_file, center_lat, center_lon)

    print(f"Saved {out_file} (center: {center_lat:.5f}, {center_lon:.5f})")

print("\nDone. Remember attribution requirements for Sentinel-2 cloudless usage.  [oai_citation:3‡s2maps.eu](https://s2maps.eu/)")