#!/bin/bash
# Stop-motion frames: f01 = v3 still, f02..f08 chained edits by Codex. Skips shots that already have f08.
cd "$(dirname "$0")/.."
while IFS=$'\t' read -r id beats; do
  out=v4/frames/$id
  [ -f $out/f08.png ] && { echo "skip $id"; continue; }
  mkdir -p $out; [ -f $out/f01.png ] || cp v3/shots/$id.png $out/f01.png
  cat > $out/prompt.md <<P
We are shooting REAL STOP-MOTION, one frame at a time, like an animator nudging a clay puppet between exposures.
Frame 1 is the attached image $out/f01.png (already saved). Generate frames 2..8 IN ORDER with your image generation tool.
For EACH new frame: use the PREVIOUS frame as the edit/reference image and change ONLY what the beat says, by a small amount. Everything else stays the same: same camera, framing, lens, lighting, set, props in the same places, same Hun model (hun-model-sheet-v2.png). Same aspect ratio and resolution as frame 1.

$(sed -n '/HUN ANATOMY RULE/,$p' v3/style-lock.md)

Beats: $beats

Save each as $out/f02.png ... $out/f08.png (PNG). After each generation, compare with the previous frame and regenerate if the camera, set, or Hun's anatomy drifted.
P
  echo "== $id $(date +%T)"
  codex exec --skip-git-repo-check -s workspace-write -C "$PWD" -i $out/f01.png -i hun/v2/hun-model-sheet-v2.png - < $out/prompt.md > $out/log.txt 2>&1
  ls $out/*.png | wc -l; tail -3 $out/log.txt
  grep -q "usage limit" $out/log.txt && { echo "LIMIT"; exit 2; }
done < v4/beats.tsv
