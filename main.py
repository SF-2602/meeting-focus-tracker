from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json
from fastapi.middleware.cors import CORSMiddleware 

from analyzer import analyze_meeting  
app = FastAPI(title="Meeting Focus Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)



class MeetingRequest(BaseModel):
    start_time: str  
    end_time: str    

class MeetingResponse(BaseModel):
    total_duration_sec: float
    engagement_percentage: float
    category_durations: Dict[str, float]
    avg_focus_seconds: float
    interval_data: List[Dict[str, Any]]

@app.post("/analyze-meeting", response_model=MeetingResponse)
async def analyze_meeting_endpoint(request: MeetingRequest):
    try:

        result = analyze_meeting(request.start_time, request.end_time)
        
        if result[0] is None:  
            raise HTTPException(status_code=404, detail="No activity data found")
            
        total_sec, engagement, cat_durations, _, avg_focus_sec, interval_data = result
        
        return MeetingResponse(
            total_duration_sec=total_sec,
            engagement_percentage=engagement,
            category_durations=cat_durations,
            avg_focus_seconds=avg_focus_sec,
            interval_data=interval_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/test-connection")
async def test_connection():
    return {"status": "OK", "message": "Backend is running"}