#!/usr/bin/env bash
set -euo pipefail

# Assumes you have run `brew install exiftool imagemagick`

# NASA GIBS WMS endpoint (EPSG:4326, "best")
BASE="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

# True-color satellite imagery layer (MODIS Terra corrected reflectance)
LAYER="MODIS_Terra_CorrectedReflectance_TrueColor"

# Pick a recent date. Change if you want a specific day (clouds vary day to day).
TIME="2026-01-10"

# Tile half-size in degrees.
# 0.005 => total bbox 0.01° x 0.01° (roughly ~1.1 km north-south)
D=0.005

# 5 random-ish real points in Puerto Rico (lat, lon)
# (All within PR; feel free to swap/expand.)
POINTS=(
  "18.468 -66.118"  # San Juan area
  "18.294 -65.793"  # El Yunque area
  "18.009 -66.614"  # Ponce area
  "18.339 -67.251"  # Rincon area
  "18.472 -66.717"  # Arecibo area
)

echo "filename,center_lat,center_lon,time,layer,bbox_lat1,bbox_lon1,bbox_lat2,bbox_lon2" > manifest.csv

i=1
for p in "${POINTS[@]}"; do
  lat=$(echo "$p" | awk '{print $1}')
  lon=$(echo "$p" | awk '{print $2}')

  # WMS 1.3.0 + EPSG:4326 uses BBOX order: lat_min, lon_min, lat_max, lon_max
  lat1=$(python3 - <<PY
lat=float("$lat"); d=float("$D"); print(f"{lat-d:.6f}")
PY
)
  lon1=$(python3 - <<PY
lon=float("$lon"); d=float("$D"); print(f"{lon-d:.6f}")
PY
)
  lat2=$(python3 - <<PY
lat=float("$lat"); d=float("$D"); print(f"{lat+d:.6f}")
PY
)
  lon2=$(python3 - <<PY
lon=float("$lon"); d=float("$D"); print(f"{lon+d:.6f}")
PY
)

  png=$(printf "PR_tile_%02d.png" "$i")
  jpg=$(printf "PR_tile_%02d.jpg" "$i")

  url="${BASE}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${LAYER}&STYLES=&FORMAT=image/png&TRANSPARENT=FALSE&CRS=EPSG:4326&BBOX=${lat1},${lon1},${lat2},${lon2}&WIDTH=100&HEIGHT=100&TIME=${TIME}"

  echo "Downloading $png ..."
  curl -L "$url" -o "$png"

  echo "Converting to JPEG $jpg ..."
  magick "$png" "$jpg"

  echo "Embedding EXIF GPS into $jpg ..."
  # Puerto Rico is N / W
  exiftool -overwrite_original \
    -GPSLatitude="$lat" -GPSLatitudeRef="N" \
    -GPSLongitude="$(echo "$lon" | sed 's/^-//')" -GPSLongitudeRef="W" \
    -ImageDescription="NASA GIBS WMS ${LAYER} TIME=${TIME} BBOX=${lat1},${lon1},${lat2},${lon2}" \
    "$jpg" >/dev/null

  echo "$jpg,$lat,$lon,$TIME,$LAYER,$lat1,$lon1,$lat2,$lon2" >> manifest.csv
  i=$((i+1))
done

echo
echo "Done."
echo "Created: PR_tile_01.jpg ... PR_tile_05.jpg"
echo "Manifest: manifest.csv"
echo
echo "Verify GPS for one file with:"
echo "  exiftool -GPS:all -a -G1 PR_tile_01.jpg"
