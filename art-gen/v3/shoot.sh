#!/bin/bash
# usage: shoot.sh <kind:ref|shot> <id> <aspect-or-desc> [desc]   (run from project root)
kind="$1"; id="$2"
if [ "$kind" = ref ]; then desc="$3"; out="art-gen/v3/refs/$id.png"; refs="art-gen/hun/v2/hun-model-sheet-v2.png reference/original/og.jpg"
else aspect="$3"; desc="$4"; out="art-gen/v3/shots/$id.png"; refs="art-gen/hun/v2/hun-model-sheet-v2.png art-gen/hun/v2/hun-expressions-v2.png art-gen/v3/refs/props-sheet.png art-gen/v3/refs/hands-sheet.png reference/original/og.jpg"; fi
[ -f "$out" ] && { echo "$id exists"; exit 0; }
p="art-gen/v3/prompts/$id.md"
{ echo "Generate ONE image with your image generation tool and save it as PNG to $out. Do not write code or other files."; echo; cat art-gen/v3/style-lock.md; echo;
  [ "$kind" = shot ] && echo "Use the attached props-sheet.png and hands-sheet.png as the exact design of the 4-tasks board, fish jar and family sleeves."
  echo "SHOT: $desc"; [ "$kind" = shot ] && echo "FRAME: $aspect aspect ratio (if the tool cannot do it exactly, use the widest landscape size and keep the action inside the central band)."; } > "$p"
codex exec --skip-git-repo-check -s workspace-write -C "$PWD" -i $refs - < "$p" > "${p%.md}.log" 2>&1
echo "$id: $([ -f "$out" ] && echo OK || echo MISSING)"
