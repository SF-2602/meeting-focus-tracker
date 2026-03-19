from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json
from fastapi.middleware.cors import CORSMiddleware 
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict
import re

from analyzer import analyze_meeting  

load_dotenv()

app = FastAPI(title="Meeting Focus Tracker API")

supabase_client: Client = create_client(
    os.getenv("SUPABASE_URL"),               
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")   
)

class UserRegisterRequest(BaseModel):
    user_id: str  

class MeetingCreateRequest(BaseModel):
    name: str
    start_time: str 
    end_time: str    
    host_user_id: str

class MeetingJoinRequest(BaseModel):
    user_id: str
    meeting_id: str

class MeetingResponse(BaseModel):
    id: str
    name: str
    start_time: str
    end_time: str
    participant_count: int

class UserMeetingResponse(BaseModel):
    meeting_id: str
    meeting_name: str
    start_time: str
    end_time: str
    role: str
    joined_at: str

class MeetingAnalyticsResponse(BaseModel):
    meeting_id: str
    total_duration_sec: float
    engagement_percentage: float
    category_durations: Dict[str, float]
    avg_focus_seconds: float
    interval_data: List[Dict[str, Any]]
    user_interval_data: Dict[str, List[Dict[str, Any]]]
    user_stats: List[Dict[str, Any]]

class TriggerAnalysisRequest(BaseModel):
    user_id: str
    start_time: str  
    end_time: str

class PublicMeetingResponse(BaseModel):
    id: str
    name: str
    start_time: str
    end_time: str
    participant_count: int
    is_joined: bool = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://meeting-focus-tracker.vercel.app",
        "http://localhost:3000",                      
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/meetings/{meeting_id}/trigger-analysis", status_code=202)
async def trigger_analysis_endpoint(
    meeting_id: str,
    req: TriggerAnalysisRequest
):
    """
    Trigger fresh analysis: fetch ActivityWatch data → categorize → save to Supabase
    Returns immediately; analysis runs synchronously (consider Celery for async in production)
    """
    try:
        print(f"\n🚀 Triggering analysis:")
        print(f"  meeting_id: {meeting_id}")
        print(f"  user_id: {req.user_id}")
        print(f"  time range: {req.start_time} to {req.end_time}")
        
        meeting = supabase_client.table("meetings").select("id").eq("id", meeting_id).execute()
        if not meeting:
            raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
        
        user = supabase_client.table("users").select("id").eq("id", req.user_id).execute()
        if not user:
            supabase_client.table("users").insert({"id": req.user_id}).execute()
            print(f"Auto-registered user {req.user_id}")
        
        from datetime import datetime, timezone, timedelta
        
        hkt_tz = timezone(timedelta(hours=8))
        start_local = datetime.fromisoformat(req.start_time.replace("Z", ""))
        end_local = datetime.fromisoformat(req.end_time.replace("Z", ""))
        
        start_utc = start_local.replace(tzinfo=hkt_tz).astimezone(timezone.utc).isoformat()
        end_utc = end_local.replace(tzinfo=hkt_tz).astimezone(timezone.utc).isoformat()
        
        print(f"  Converted to UTC: {start_utc} to {end_utc}")
        
        from analyzer import analyze_meeting
        
        result = analyze_meeting(
            start_iso=start_utc,
            end_iso=end_utc,
            user_id=req.user_id,      
            meeting_id=meeting_id     
        )
        
        if result[0] is None:
            print(f"No ActivityWatch events found for this time range")
            return {
                "status": "completed",
                "message": "No activity data found in ActivityWatch for this time range",
                "events_processed": 0
            }
        
        total_sec, engagement, cat_durations, event_details, avg_focus, interval_data = result
        
        print(f"    Analysis complete:")
        print(f"    - Total duration: {total_sec/60:.1f} min")
        print(f"    - Engagement: {engagement}%")
        print(f"    - Events saved: {len(interval_data)} intervals")
        print(f"    - Categories: {cat_durations}")
        
        return {
            "status": "completed",
            "message": "Analysis completed successfully",
            "events_processed": len(interval_data),
            "summary": {
                "total_duration_sec": total_sec,
                "engagement_percentage": engagement,
                "category_durations": cat_durations,
                "avg_focus_seconds": avg_focus
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Trigger analysis error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/users/register", status_code=201)
async def register_user(req: UserRegisterRequest):
    """Register a new user or return existing"""
    try:
        result = supabase_client.table("users").upsert({
            "id": req.user_id
        }, on_conflict="id").execute()
        return {"user_id": req.user_id, "registered": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.get("/users/{user_id}/meetings", response_model=List[UserMeetingResponse])
async def get_user_meetings(user_id: str):
    try:
        print(f"Fetching meetings for user: {user_id}")
        
        result = supabase_client.table("user_meetings").select("""
            meeting_id,
            role,
            joined_at,
            meetings!inner (
                id,
                meetings,
                start_time,
                end_time
            )
        """).eq("user_id", user_id).order("joined_at", desc=True).execute()
        
        print(f"Query result: {result}")
        print(f"Data: {result.data}")
        
        if not result.data:
            print("No meetings found for user")
            return []
        
        meetings = []
        for row in result.data:
            meeting = row.get("meetings", {})
            meetings.append({
                "meeting_id": row["meeting_id"],
                "meeting_name": meeting.get("meetings", "Untitled"),
                "start_time": meeting.get("start_time"),
                "end_time": meeting.get("end_time"),
                "role": row["role"],
                "joined_at": row["joined_at"]
            })
        
        print(f"Returning {len(meetings)} meetings")
        return meetings
    except Exception as e:
        print(f"Get meetings error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch meetings: {str(e)}")

@app.post("/meetings/join")
async def join_meeting(req: MeetingJoinRequest):
    """Add a user to a meeting"""
    try:
        result = supabase_client.table("user_meetings").insert({
            "user_id": req.user_id,
            "meeting_id": req.meeting_id
        }).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        if "unique constraint" in str(e).lower():
            return {"success": True, "message": "Already joined"}
        raise HTTPException(status_code=500, detail=f"Join failed: {str(e)}")

@app.post("/meetings", status_code=201)
async def create_meeting(req: MeetingCreateRequest):
    try:
        user_check = supabase_client.table("users").select("id").eq("id", req.host_user_id).execute()
        if not user_check.data:
            supabase_client.table("users").insert({"id": req.host_user_id}).execute()
        
        start_local = datetime.fromisoformat(req.start_time.replace("Z", ""))
        end_local = datetime.fromisoformat(req.end_time.replace("Z", ""))
        
        meeting_result = supabase_client.table("meetings").insert({
            "meetings": req.name,
            "start_time": start_local.isoformat(),  
            "end_time": end_local.isoformat(),
        }).execute()
        
        if not meeting_result.data:
            raise Exception("Failed to create meeting")
        
        meeting_id = meeting_result.data[0]["id"]
        
        supabase_client.table("user_meetings").insert({
            "user_id": req.host_user_id,
            "meeting_id": meeting_id,
            "role": "host"
        }).execute()
        
        return {"meeting_id": meeting_id, "name": req.name}
    except Exception as e:
        print(f"Meeting creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Creation failed: {str(e)}")

@app.get("/meetings/public", response_model=List[PublicMeetingResponse])
async def get_public_meetings(user_id: Optional[str] = Query(None)):
    """
    List all meetings (optionally mark which ones user has joined)
    """
    try:
        print(f"🔍 GET /meetings/public called with user_id={user_id}")
        
        meetings_result = supabase_client.table("meetings").select("""
            id, meetings, start_time, end_time
        """).order("start_time", desc=True).limit(100).execute()
        
        meetings_data = meetings_result.data or []
        print(f"     Found {len(meetings_data)} meetings in database")
        

        if not meetings_data:
            return []

        meeting_ids = [m["id"] for m in meetings_data]
        
        count_map = defaultdict(int)
        if meeting_ids:
            counts_result = supabase_client.table("user_meetings").select(
                "meeting_id"
            ).in_("meeting_id", meeting_ids).execute()
            
            counts_data = counts_result.data or []
            for row in counts_data:
                mid = row.get("meeting_id")
                if mid:
                    count_map[mid] += 1
        
        joined_map = {}
        if user_id:
            print(f"🔍 Checking joined meetings for user: {user_id}")
            joined_result = supabase_client.table("user_meetings").select(
                "meeting_id"
            ).eq("user_id", user_id).in_("meeting_id", meeting_ids).execute()
            
            joined_data = joined_result.data or []
            for row in joined_data:
                mid = row.get("meeting_id")
                if mid:
                    joined_map[mid] = True
            print(f" User has joined {len(joined_map)} meetings")
        

        meetings = []
        for m in meetings_data: 
            meetings.append({
                "id": m["id"],
                "name": m["meetings"], 
                "start_time": m["start_time"],
                "end_time": m["end_time"],
                "participant_count": count_map.get(m["id"], 0),
                "is_joined": joined_map.get(m["id"], False)
            })
        
        print(f" Returning {len(meetings)} public meetings")
        return meetings
        
    except Exception as e:
        import traceback
        print(f" Error in get_public_meetings: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch meetings: {str(e)}")
    
@app.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str):
    """Get meeting details with participant count"""
    try:
        meeting_result = supabase_client.table("meetings").select("*").eq("id", meeting_id).single().execute()
        if not meeting_result.data:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        meeting = meeting_result.data
        

        count_result = supabase_client.table("user_meetings").select("id", count="exact").eq("meeting_id", meeting_id).execute()
        
        return MeetingResponse(
            id=meeting["id"],
            name=meeting["meetings"], 
            start_time=meeting["start_time"],
            end_time=meeting["end_time"],
            participant_count=count_result.count or 0
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fetch failed: {str(e)}")

    

@app.post("/meetings/{meeting_id}/analyze", response_model=MeetingAnalyticsResponse)
async def analyze_meeting_endpoint(
    meeting_id: str,
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None)
):
    """
    Analyze ALL users' activity for a meeting.
    Returns aggregate stats + per-user breakdown.
    """
    try:
        from datetime import datetime, timezone, timedelta

        def hkt_to_utc(ts: Optional[str]) -> Optional[str]:
            if not ts:
                return None

            ts = re.sub(r'(:\d{2}:\d{2}):\d{2}$', r'\1', ts)

            if ts.endswith('Z') or '+' in ts[-6:]:
                return ts
            
            try:
                dt = datetime.fromisoformat(ts)
                hkt_tz = timezone(timedelta(hours=8))
                dt = dt.replace(tzinfo=hkt_tz)

                return dt.astimezone(timezone.utc).isoformat()
            except ValueError as e:
                print(f"⚠️ Failed to parse timestamp '{ts}': {e}")
                return None

        if not start_time or not end_time:
            meeting = supabase_client.table("meetings").select("start_time", "end_time").eq("id", meeting_id).single().execute()
            if not meeting.data:
                raise HTTPException(status_code=404, detail="Meeting not found")
            
            start_time = hkt_to_utc(meeting.data["start_time"])
            end_time = hkt_to_utc(meeting.data["end_time"])
        else:

            print(f"     Converting query params from HKT → UTC:")
            print(f"     Input: start={start_time}, end={end_time}")
            
            start_time = hkt_to_utc(start_time)
            end_time = hkt_to_utc(end_time)
            
            print(f"   Output: start={start_time}, end={end_time}")
        
        if not start_time or not end_time:
            raise HTTPException(status_code=400, detail="Invalid time range format")
        
        print(f"    Querying window_events:")
        print(f"    meeting_id: {meeting_id}")
        print(f"    timestamp >= {start_time} (UTC)")
        print(f"    timestamp <= {end_time} (UTC)")
        
        query = supabase_client.table("window_events").select("*").eq("meeting_id", meeting_id)
        
        if start_time:
            query = query.gte("timestamp", start_time)
        if end_time:
            query = query.lte("timestamp", end_time)
        
        query = query.order("timestamp", desc=False)
        result = query.execute()
        rows = result.data or []
        
        print(f"     Found {len(rows)} window_events for meeting {meeting_id}")

        if not rows:
            print(f"⚠️ No rows found for meeting_id={meeting_id} in time range")
            return MeetingAnalyticsResponse(
                meeting_id=meeting_id,
                total_duration_sec=0,
                engagement_percentage=0.0,
                category_durations={},
                avg_focus_seconds=0.0,
                interval_data=[],
                user_interval_data={},  
                user_stats=[]
            )

        users_in_meeting = set(r["user_id"] for r in rows)
        print(f" Found {len(users_in_meeting)} unique users in meeting")

        user_interval_data = {}
        for uid in users_in_meeting:
            user_rows = [r for r in rows if r["user_id"] == uid]
            user_interval_data[uid] = build_interval_data(user_rows, meeting_id)

        total_duration_sec = sum(r["duration_seconds"] for r in rows)
        
        
        cat_durations = defaultdict(float)
        for r in rows:
            cat_durations[r["category"]] += r["duration_seconds"]
        
        engaged_duration = cat_durations.get("meeting", 0) + cat_durations.get("work_related", 0)
        engagement_pct = round(engaged_duration / total_duration_sec * 100, 1) if total_duration_sec > 0 else 0
        
        focus_durations = []
        current_start = None
        sorted_rows = sorted(rows, key=lambda x: x["timestamp"])
        
        for r in sorted_rows:
            ts = datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00"))
            if r["category"] in ("meeting", "work_related"):
                if current_start is None:
                    current_start = ts
            else:
                if current_start:
                    dur = (ts - current_start).total_seconds()
                    if dur > 0:
                        focus_durations.append(dur)
                    current_start = None
        
        if current_start:
            last_ts = datetime.fromisoformat(sorted_rows[-1]["timestamp"].replace("Z", "+00:00"))
            dur = (last_ts - current_start).total_seconds()
            if dur > 0:
                focus_durations.append(dur + 300)
        avg_focus_sec = sum(focus_durations) / len(focus_durations) if focus_durations else 0
        
        interval_data = build_interval_data(rows, meeting_id)
        
        user_stats = []
        users_in_meeting = set(r["user_id"] for r in rows)
        
        for uid in users_in_meeting:
            user_rows = [r for r in rows if r["user_id"] == uid]
            user_total = sum(r["duration_seconds"] for r in user_rows)
            user_engaged = sum(
                r["duration_seconds"] for r in user_rows 
                if r["category"] in ("meeting", "work_related")
            )
            user_engagement = round(user_engaged / user_total * 100, 1) if user_total > 0 else 0
            
            user_cat_durations = defaultdict(float)
            for r in user_rows:
                user_cat_durations[r["category"]] += r["duration_seconds"]
            
            user_stats.append({
                "user_id": uid,
                "total_duration_sec": user_total,
                "engagement_percentage": user_engagement,
                "category_durations": dict(user_cat_durations)
            })
        
        print(f"    Returning analytics: {engagement_pct}% engagement, {len(user_stats)} users")
        
        return MeetingAnalyticsResponse(
            meeting_id=meeting_id,
            total_duration_sec=round(total_duration_sec),
            engagement_percentage=engagement_pct,
            category_durations=dict(cat_durations),
            avg_focus_seconds=round(avg_focus_sec),
            interval_data=interval_data,
            user_interval_data=user_interval_data,
            user_stats=user_stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f" Analysis error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def build_interval_data(rows: List[Dict], meeting_id: str, bin_minutes: int = 5) -> List[Dict[str, Any]]:
    """Build 5-minute interval data for timeline visualization (all users combined)"""
    if not rows:
        return []
    
    from datetime import datetime, timedelta, timezone
    from collections import defaultdict
    

    timestamps = []
    for r in rows:
        ts_str = r["timestamp"]
        if ts_str.endswith("Z"):
            ts_str = ts_str[:-1] + "+00:00"
        timestamps.append(datetime.fromisoformat(ts_str))
    
    if not timestamps:
        return []
    
    start = min(timestamps)
    end = max(timestamps)
    
    start_rounded = start.replace(
        minute=(start.minute // bin_minutes) * bin_minutes,
        second=0,
        microsecond=0
    )

    hkt_tz = timezone(timedelta(hours=8))
    
    interval_data = []
    current_bin = start_rounded
    
    while current_bin < end:
        bin_end = min(current_bin + timedelta(minutes=bin_minutes), end)
        bin_total_sec = (bin_end - current_bin).total_seconds()
        
        if bin_total_sec <= 0:
            break
        
        bin_events = []
        for r in rows:

            ev_ts_str = r["timestamp"]
            if ev_ts_str.endswith("Z"):
                ev_ts_str = ev_ts_str[:-1] + "+00:00"
            ev_start = datetime.fromisoformat(ev_ts_str)
            ev_end = ev_start + timedelta(seconds=r["duration_seconds"])
            
            overlap = compute_overlap(ev_start, ev_end, current_bin, bin_end)
            if overlap > 0:
                bin_events.append((overlap, r))
        
        if bin_events:
            dominant = max(bin_events, key=lambda x: x[0])
            _, event = dominant
            engaged_pct = 100 if event["category"] in ("meeting", "work_related") else 0
        else:
            event = {"app": "Unknown", "category": "other", "title": "No activity"}
            engaged_pct = 0
        
        local_bin = current_bin.astimezone(hkt_tz)
        
        interval_data.append({
            "time": local_bin.strftime("%H:%M"),  
            "category": event.get("category", "other"),
            "app": event.get("app", "Unknown"),
            "title": (event.get("title", "—")[:60] + "...") if len(event.get("title", "")) > 60 else event.get("title", "—"),
            "engaged_pct": engaged_pct
        })
        
        current_bin = bin_end
    
    return interval_data


def compute_overlap(start1, end1, start2, end2):
    """Calculate overlap in seconds between two time ranges"""
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    return max(0, (overlap_end - overlap_start).total_seconds())

@app.get("/test-connection")
async def test_connection():
    return {"status": "OK", "message": "Backend is running"}