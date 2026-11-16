#!/bin/bash
# usage: shoot.sh <id> <shot> <motion>   (run from project root)
id="$1"; shot="$2"; motion="$3"; out="art-gen/shots/$id"; mkdir -p "$out"
cat > "$out/prompt.md" <<P
Use your image generation/editing tool. Do not write code except to copy files.

STEP 1 — generate the base image and save it as $out/f1.png.
$(cat art-gen/prompts/_style-lock-cinematic.md)
CHARACTER REFERENCE: the attached hun-model-sheet-v2.png and hun-expressions-v2.png are the ONLY correct look for Hun (dark slate-grey #50454F body, white face/belly patch with a V-point on the forehead, dark brown eyes with two white highlights, orange beak and feet, coral heart on belly, 2-3 leaf tuft). Ignore Hun's look in any other image.
SHOT: $shot

STEP 2 — make a stop-motion sequence: create f2.png ... f8.png in $out by EDITING the previous frame each time. Keep EVERYTHING identical (camera, framing, set, props, lighting, colours, image size) except this motion, advancing in small even steps like real stop-motion:
$motion
Hun's identity and colours must stay exactly as in the model sheet in every frame.
P
codex exec --skip-git-repo-check -s workspace-write -C "$PWD" -i art-gen/hun/v2/hun-model-sheet-v2.png art-gen/hun/v2/hun-expressions-v2.png reference/original/og.jpg - < "$out/prompt.md" > "$out/codex.log" 2>&1
echo "$id: $(ls $out/f*.png 2>/dev/null | wc -l | tr -d ' ') frames"
