#!/bin/bash
# render queue: processes out/queue/*.job one at a time (each job: "<Comp> <name> <total>"), source frozen in .snap/<name>
cd /home/user/Projekt-1
while true; do
  j=$(ls out/queue/*.job 2>/dev/null | sort | head -1)
  if [ -z "$j" ]; then sleep 30; continue; fi
  read COMP NAME TOTAL < $j
  mkdir -p out/$NAME
  ENTRY=.snap/$NAME/src/index.ts scripts/render_video.sh $COMP $NAME $TOTAL >> out/$NAME/render.log 2>&1
  mv $j $j.done
done
