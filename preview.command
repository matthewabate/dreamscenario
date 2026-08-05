#!/bin/bash
# Double-click this file to preview the site the way it'll actually behave
# once hosted: real navigation between pages, no full reloads, no
# background flash. Opening index.html directly (file://) can't do this —
# browsers block that kind of local file-to-file fetch for security reasons.
cd "$(dirname "$0")"
( sleep 1 && open "http://localhost:8000/" ) &
echo "Serving the site at http://localhost:8000 — press Ctrl+C in this window to stop."
python3 -m http.server 8000
