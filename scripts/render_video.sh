#!/bin/bash
# usage: scripts/render_video.sh <CompositionId> <videoName> <totalFrames> [dpr]
# renders in 250-frame chunks (resumable), concatenates, muxes videos/<name>/audio/mix.wav -> videos/<name>/<name>.mp4
COMP=$1; NAME=$2; TOTAL=$3; DPR=${4:-0.8}
CHROME=${CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
D=out/$NAME/chunks; mkdir -p $D; : > $D/list.txt
last=$((TOTAL-1))
for a in $(seq 0 250 $last); do
  b=$((a+249)); [ $b -gt $last ] && b=$last
  f=$D/c_$(printf %04d $a).mp4
  echo "file '$(basename $f)'" >> $D/list.txt
  [ -s $f ] && continue
  for try in 1 2 3; do
    npx remotion render ${ENTRY:-src/index.ts} $COMP $f --frames=$a-$b --props="{\"post\":{\"dpr\":$DPR}}" --concurrency=4 --gl=angle \
      --browser-executable=$CHROME --codec=h264 --crf=18 --timeout=300000 --log=error && break
    echo "chunk $a failed (try $try)"; rm -f $f
  done
  echo "$NAME chunk $a done $(date +%T)"
done
ffmpeg -v error -y -f concat -safe 0 -i $D/list.txt -c copy out/$NAME/video_silent.mp4 && \
ffmpeg -v error -y -i out/$NAME/video_silent.mp4 -i videos/$NAME/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart videos/$NAME/$NAME.mp4 && echo "$NAME ALLDONE"
