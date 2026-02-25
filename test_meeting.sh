START=$(date -u -v-30M +%Y-%m-%dT%H:%M:%SZ)
END=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl -X POST http://localhost:8000/analyze-meeting \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "'$START'",
    "end_time": "'$END'",
    "user_id": "student_123",
    "meeting_id": "meeting_456"
  }'