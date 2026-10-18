#!/bin/bash
cd "$(dirname "$0")" || exit 1
export NEXT_TELEMETRY_DISABLED=1
export CHECKPOINT_DISABLE=1

# 背景等待伺服器就緒後開啟瀏覽器（最多等 60 秒）
(
  for _ in $(seq 60); do
    if curl -s -o /dev/null http://localhost:3000; then
      open http://localhost:3000
      exit 0
    fi
    sleep 1
  done
) &

npm run dev
