#!/bin/bash
# usage: scripts/sheet.sh <dir> <out.jpg> [cols]  -> contact sheet of <dir>/x_*.jpg sorted by frame (270x480 tiles)
d=$1; out=$2; cols=${3:-7}
files=$(ls $d/x_*.jpg | sort -t_ -k2 -n); n=$(echo "$files" | wc -l)
ins=""; fc=""; i=0; lay=""
for f in $files; do b=$(basename $f .jpg); ins="$ins -i $f"; fc="$fc[$i]scale=270:480,drawtext=text='$b':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black[v$i];"; lay="$lay$(( (i%cols)*270 ))_$(( (i/cols)*480 ))|"; i=$((i+1)); done
for j in $(seq 0 $((n-1))); do fc="$fc[v$j]"; done
ffmpeg -v error -y $ins -filter_complex "${fc}xstack=inputs=$n:layout=${lay%|}:fill=black" $out
