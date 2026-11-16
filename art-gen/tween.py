"""Optical-flow in-betweens for the Codex stop-motion takes.

Usage: python3 -I art-gen/tween.py <project_root> [ids...]
Reads art-gen/shots/<id>/f1..f8.png and writes art-gen/tween/<id>/f01.png... with N_IN frames
interpolated between each pair, so Hun moves continuously instead of jumping between AI drawings.
"""
import os, sys, glob
import cv2
import numpy as np

N_IN = 2  # in-betweens per pair
root = sys.argv[1]
src_dir = os.path.join(root, 'art-gen', 'shots')
out_dir = os.path.join(root, 'art-gen', 'tween')
ids = sys.argv[2:] or sorted(os.listdir(src_dir))
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)

def frames(d):
    fs = glob.glob(os.path.join(d, 'f*.png'))
    return sorted(fs, key=lambda f: int(os.path.basename(f)[1:-4]))

def interp(a, b, t):
    ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    f_ab = dis.calc(ga, gb, None)
    f_ba = dis.calc(gb, ga, None)
    h, w = ga.shape
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    wa = cv2.remap(a, gx - t * f_ab[..., 0], gy - t * f_ab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    wb = cv2.remap(b, gx - (1 - t) * f_ba[..., 0], gy - (1 - t) * f_ba[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return cv2.addWeighted(wa, 1 - t, wb, t, 0)

for sid in ids:
    fs = frames(os.path.join(src_dir, sid))
    if len(fs) < 6:
        print(f'{sid}: skipped ({len(fs)} frames)')
        continue
    imgs = [cv2.imread(f) for f in fs]
    od = os.path.join(out_dir, sid)
    os.makedirs(od, exist_ok=True)
    for old in glob.glob(os.path.join(od, 'f*.png')):
        os.remove(old)
    seq = []
    for i in range(len(imgs) - 1):
        seq.append(imgs[i])
        for k in range(1, N_IN + 1):
            seq.append(interp(imgs[i], imgs[i + 1], k / (N_IN + 1)))
    seq.append(imgs[-1])
    for i, im in enumerate(seq):
        cv2.imwrite(os.path.join(od, f'f{i + 1:02d}.png'), im)
    print(f'{sid}: {len(seq)} frames')
