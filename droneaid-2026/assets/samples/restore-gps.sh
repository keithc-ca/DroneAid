#!/usr/bin/env bash

for f in pr_s2_tiles/*.jpg; do
  LAT=$(echo "$f" | sed -E 's/.*_([0-9]+\.[0-9]+)_-([0-9]+\.[0-9]+)\.jpg/\1/')
  LON=$(echo "$f" | sed -E 's/.*_([0-9]+\.[0-9]+)_-([0-9]+\.[0-9]+)\.jpg/\2/')

  exiftool -overwrite_original \
    -GPSLatitude="$LAT" -GPSLatitudeRef=N \
    -GPSLongitude="$LON" -GPSLongitudeRef=W \
    -GPSMapDatum=WGS-84 \
    "$f"
done