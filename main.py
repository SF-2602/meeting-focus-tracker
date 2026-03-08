from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json
from fastapi.middleware.cors import CORSMiddleware 
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

from analyzer import analyze_meeting  

load_dotenv()

app = FastAPI(title="Meeting Focus Tracker API")

supabase_client: Client = create_client(
    os.getenv("SUPABASE_URL"),               
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")   
)


class MeetingRequest(BaseModel):
    start_time: str  
    end_time: str    
    user_id: str    
    meeting_id: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
 

class MeetingResponse(BaseModel):
    total_duration_sec: float
    engagement_percentage: float
    category_durations: Dict[str, float]
    avg_focus_seconds: float
    interval_data: List[Dict[str, Any]]

@app.post("/analyze-meeting", response_model=MeetingResponse)
async def analyze_meeting_endpoint(request: MeetingRequest):
    try:
        result = analyze_meeting(
            request.start_time,
            request.end_time,
            user_id=request.user_id,
            meeting_id=request.meeting_id
        )

        if result[0] is None:
            print(f"No events found for {request.user_id} — returning zeroed data")
            return MeetingResponse(
                total_duration_sec=0,
                engagement_percentage=0.0,
                category_durations={},
                avg_focus_seconds=0.0,
                interval_data=[]
            )

        total_sec, engagement, cat_durations, _, avg_focus_sec, interval_data = result
        
        return MeetingResponse(
            total_duration_sec=total_sec,
            engagement_percentage=engagement,
            category_durations=cat_durations,
            avg_focus_seconds=avg_focus_sec,
            interval_data=interval_data
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# @app.post("/analyze-meeting", response_model=MeetingResponse)
# async def analyze_meeting_endpoint(request: MeetingRequest):
#     try:

#         result = analyze_meeting(
#             request.start_time,
#             request.end_time,
#             user_id=request.user_id,
#             meeting_id=request.meeting_id
#         )
        
#         if result[0] is None:  
#             raise HTTPException(status_code=404, detail="No activity data found")
            
#         total_sec, engagement, cat_durations, _, avg_focus_sec, interval_data = result
        
#         return MeetingResponse(
#             total_duration_sec=total_sec,
#             engagement_percentage=engagement,
#             category_durations=cat_durations,
#             avg_focus_seconds=avg_focus_sec,
#             interval_data=interval_data
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
@app.get("/meeting-focus", response_model=MeetingResponse)
async def get_meeting_focus(
    user_id: str,
    meeting_id: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
):
    """
    Get focus statistics and timeline for a user / meeting from Supabase
    """
    query = supabase_client.table("window_events").select("*").eq("user_id", user_id)

    if meeting_id:
        query = query.eq("meeting_id", meeting_id)
    if start_time:
        query = query.gte("timestamp", start_time)
    if end_time:
        query = query.lte("timestamp", end_time)

    query = query.order("timestamp", desc=False)

    result = query.execute()

     # log for debugging purposes
    # print("supabase query returned", {"error": result.error, "data_len": len(result.data) if result.data else 0})

    # convert None to empty list to simplify downstream logic
    rows = result.data or []
    print(f"Supabase query → found {len(rows)} rows for user_id={user_id}")

    # if there are no rows just return an empty payload instead of a 404
    if not rows:
        return {
            "total_duration_sec": 0,
            "engagement_percentage": 0,
            "category_durations": {},
            "avg_focus_seconds": 0,
            "interval_data": []
        }

    if not rows:
        return {
            "total_duration_sec": 0,
            "engagement_percentage": 0,
            "category_durations": {},
            "avg_focus_seconds": 0,
            "interval_data": []
        }

    total_duration_sec = sum(r["duration_seconds"] for r in rows)

    cat_durations = defaultdict(float)
    for r in rows:
        cat_durations[r["category"]] += r["duration_seconds"]

    interval_data = []
    for r in rows:
        # Convert stored timestamp to local timezone for display
        local_ts = datetime.fromisoformat(r["timestamp"]).astimezone()
        interval_data.append({
            "time": local_ts.strftime("%H:%M"),
            "category": r["category"],
            "app": r["app"],
            "title": "—",          
            "engaged_pct": 100 if r["category"] in ("meeting", "work_related") else 0
        })

    first_ts = datetime.fromisoformat(rows[0]["timestamp"])
    last_ts  = datetime.fromisoformat(rows[-1]["timestamp"])

    focus_durations = []
    current_start = None
    for r in rows:
        if r["category"] in ("meeting", "work_related"):
            if current_start is None:
                current_start = datetime.fromisoformat(r["timestamp"])
        else:
            if current_start:
                dur = (datetime.fromisoformat(r["timestamp"]) - current_start).total_seconds()
                focus_durations.append(dur)
                current_start = None

    if current_start:
        dur = (last_ts - current_start).total_seconds() + 300
        focus_durations.append(dur)

    avg_focus_sec = sum(focus_durations) / len(focus_durations) if focus_durations else 0

    engaged_duration = cat_durations.get("meeting", 0) + cat_durations.get("work_related", 0)
    engagement_pct = round(engaged_duration / total_duration_sec * 100, 1) if total_duration_sec > 0 else 0

    return {
        "total_duration_sec": round(total_duration_sec),
        "engagement_percentage": engagement_pct,
        "category_durations": dict(cat_durations),
        "avg_focus_seconds": round(avg_focus_sec),
        "interval_data": interval_data
    }

@app.get("/test-connection")
async def test_connection():
    return {"status": "OK", "message": "Backend is running"}