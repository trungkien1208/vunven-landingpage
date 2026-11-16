#!/bin/bash
# usage: shoot1.sh <kind> <id> <desc>   (run from project root)
kind="$1"; id="$2"; desc="$3"; lock="$(cat art-gen/prompts/_style-lock-cinematic.md)"
case "$kind" in
plates) out="art-gen/cut/plates/$id.png"; body="EMPTY SET PLATE — there must be NO character, NO penguin, NO Hun, no people, no animals in this image; Hun will be composited in later.
Keep a clear empty stage area in the LEFT-CENTRE of the frame (roughly 25%–55% of the width) on the foreground surface, where a 1/3-frame-tall character will stand.
SCENE: $desc
16:9 landscape.";;
hun) out="art-gen/cut/hun/$id.png"; body="CHARACTER SPRITE of Hun ONLY — exactly as in the attached hun-model-sheet-v2.png and hun-expressions-v2.png (dark slate-grey #50454F body, white face/belly patch with a V-point on the forehead, dark brown eyes with two white highlights, orange beak and feet, coral heart on the belly, 2-3 leaf tuft). Same size and proportions as the model sheet.
POSE: $desc.
Full body, centred, feet near the bottom of the image, nothing cut off. Soft even studio light from the upper left, matte clay with fingerprints.
BACKGROUND: perfectly flat solid pure chroma green #00FF00 filling the entire background, no gradient, no floor, no shadow on the background, no props, no text.
Square 1:1.";;
props) out="art-gen/cut/props/$id.png"; body="PROP SPRITE ONLY, handmade clay: $desc. Centred, filling about 70% of the image, nothing cut off, soft even light from the upper left.
BACKGROUND: perfectly flat solid pure chroma green #00FF00 filling the entire background, no gradient, no shadow, no other objects, no text.
Square 1:1.";;
esac
[ -f "$out" ] && { echo "$kind/$id exists"; exit 0; }
prompt="Generate ONE image with your image generation tool and save it as PNG to $out. Do not write code or other files.
$( [ "$kind" = plates ] && echo "$lock" | grep -v '^CHARACTER' )
$body"
echo "$prompt" > "art-gen/prompts/cut/$kind-$id.md"
codex exec --skip-git-repo-check -s workspace-write -C "$PWD" -i art-gen/hun/v2/hun-model-sheet-v2.png art-gen/hun/v2/hun-expressions-v2.png reference/original/og.jpg - < "art-gen/prompts/cut/$kind-$id.md" > "art-gen/prompts/cut/$kind-$id.log" 2>&1
echo "$kind/$id: $([ -f "$out" ] && echo OK || echo MISSING)"
