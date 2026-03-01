#!/bin/bash
set -e

URL="$1"

if [ -z "$URL" ]; then
  echo '{"error": "URL required"}'
  exit 1
fi

# Direct video URL
if [[ "$URL" == *.m3u8* ]] || [[ "$URL" == *.mp4* ]]; then
  echo "$URL"
  exit 0
fi

# Extract VOE video URL
extract_voe() {
  local voe_url="$1"
  local html=$(curl -sL "$voe_url" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    2>/dev/null)
  
  # Find HLS URL in jwplayer
  echo "$html" | grep -oP 'file:\s*"(https?://[^"]+\.m3u8[^"]*)"' | sed 's/file: "//;s/"$//' | head -1
}

# Extract from s.to
extract_sto() {
  local sto_url="$1"
  local html=$(curl -sL "$sto_url" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    2>/dev/null)
  
  # Find VOE redirect URL
  local redirect=$(echo "$html" | grep -oP 'data-play-url="[^"]+"' | head -1 | sed 's/data-play-url="//;s/"$//')
  
  if [ -n "$redirect" ]; then
    # Follow redirect
    curl -sLI "https://s.to$redirect" \
      -H "User-Agent: Mozilla/5.0" \
      2>/dev/null | grep -i "^location:" | tail -1 | sed 's/location: //i' | tr -d '\r'
  fi
}

# Main logic
if [[ "$URL" == *s.to* ]] || [[ "$URL" == *serienstream.to* ]]; then
  voe_url=$(extract_sto "$URL")
  [ -n "$voe_url" ] && extract_voe "$voe_url"
elif [[ "$URL" == *voe.sx* ]]; then
  extract_voe "$URL"
else
  echo '{"error": "Unsupported site"}'
  exit 1
fi
