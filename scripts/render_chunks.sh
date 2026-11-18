#!/bin/bash
# renders KoepenickShort in chunks (skips finished ones), then concatenates them: out/final/video_silent.mp4
CHROME=${CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p out/chunks; : > out/chunks/list.txt
for a in $(seq 0 250 1699); do
  b=$((a+249)); [ $b -gt 1699 ] && b=1699
  f=out/chunks/c_$(printf %04d $a).mp4
  echo "file '$(basename $f)'" >> out/chunks/list.txt
  [ -s $f ] && continue
  for try in 1 2 3; do
    npx remotion render src/index.ts KoepenickShort $f --frames=$a-$b --props='{"post":{"dpr":0.6667}}' --concurrency=4 --gl=angle \
      --browser-executable=$CHROME --codec=h264 --crf=18 --timeout=300000 --log=error && break
    echo "chunk $a failed (try $try)"; rm -f $f
  done
  echo "chunk $a done $(date +%T)"
done
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/final/video_silent.mp4 && echo ALLDONE
