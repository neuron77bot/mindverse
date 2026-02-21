#!/bin/bash
# Transcribe audio using ffmpeg + whisper-cli
INPUT="$1"
TEMP_WAV="/tmp/whisper-$$.wav"

# Convert to WAV
ffmpeg -i "$INPUT" -ar 16000 -ac 1 -c:a pcm_s16le "$TEMP_WAV" -y 2>/dev/null

# Transcribe with whisper (extract only text)
whisper-cli -m /app/whisper-models/ggml-tiny.bin -l es -nt -np "$TEMP_WAV" 2>&1 | \
  grep -v "^whisper_" | grep -v "^output_" | grep -v "^\[" | \
  sed 's/^[[:space:]]*//' | grep -v '^$'

# Cleanup
rm -f "$TEMP_WAV"
