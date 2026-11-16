#!/bin/bash
# Screenplay v5, 16:9. Per shot: Codex draws frame 1 from the description, then frames 2..8 as small chained
# stop-motion nudges. Posters are a single frame. Skips shots that already have their last frame.
cd "$(dirname "$0")/.."
prev=""
while IFS=$'\t' read -r id desc beats; do
  out=v5/frames/$id
  last=$out/f08.png; [ "$beats" = "-" ] && last=$out/f01.png
  if [ -f "$last" ]; then echo "skip $id"; prev=$out/f01.png; continue; fi
  mkdir -p $out
  refs=(-i hun/v2/hun-model-sheet-v2.png -i hun/v2/hun-expressions-v2.png -i v3/refs/hands-sheet.png)
  [ -n "$prev" ] && [ -f "$prev" ] && refs+=(-i "$prev")
  if [ "$beats" = "-" ]; then
    frames="Save it as $out/f01.png. Only one image."
  else
    frames="Save it as $out/f01.png. Then we shoot REAL STOP-MOTION: generate frames 2..8 IN ORDER, each one using the PREVIOUS frame as the edit/reference image and changing ONLY what the beat says, by a small amount (an animator's nudge). Everything else stays the same: camera, framing, lens, lighting, set, props, Hun's model. Beats: $beats
Save them as $out/f02.png ... $out/f08.png. After each frame, compare with the previous one and regenerate if the camera, set or Hun's anatomy drifted."
  fi
  cat > $out/prompt.md <<P
Use your image generation tool.

$(cat v3/style-lock.md)

ASPECT: wide 16:9 (e.g. 1792x1008 or the closest 16:9 size the tool supports). Not 2.39:1.
CONTINUITY: the last attached image (if any) is the previous shot of the same film; keep the same house, palette and clay look.
Do not draw any readable letters or numbers anywhere; phone and tablet screens show only icons and shapes.

SHOT $id: $desc

$frames
P
  echo "== $id $(date +%T)"
  codex exec --skip-git-repo-check -s workspace-write -C "$PWD" "${refs[@]}" - < $out/prompt.md > $out/log.txt 2>&1
  ls $out/*.png 2>/dev/null | wc -l; tail -2 $out/log.txt
  grep -qi "usage limit" $out/log.txt && { echo "LIMIT"; exit 2; }
  prev=$out/f01.png
done < v5/shots.tsv
echo ALL DONE
