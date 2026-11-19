#!/bin/bash
cd /home/user/Projekt-1
until grep -q "ALLDONE" out/geld/render.log 2>/dev/null; do sleep 60; done
exec scripts/queue.sh
