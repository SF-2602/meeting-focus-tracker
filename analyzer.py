import socket
from aw_client import ActivityWatchClient
from aw_core.models import Event
from datetime import datetime, timedelta, timezone
import ollama  
from collections import defaultdict

HOSTNAME = socket.gethostname()
WINDOW_BUCKET = f"aw-watcher-window_{HOSTNAME}"
AFK_BUCKET = f"aw-watcher-afk_{HOSTNAME}"

client = ActivityWatchClient("meeting-focus-client", testing=False)
CATEGORIZATION_CACHE = {}

def get_meeting_events(start: datetime, end: datetime) -> list[Event]:
    """Query window events during meeting time"""
    events = client.get_events(
        WINDOW_BUCKET,
        start=start,
        end=end,
        limit=10000  
    )

    filtered_events = [
        ev for ev in events 
        if ev.data.get("app", "").lower() not in ["loginwindow", "lockscreen", "screensaver"]
    ]

    return sorted(filtered_events, key=lambda e: e.timestamp)

def categorize_window_event(event: Event) -> str:
    """Categorize using local Ollama LLM (e.g., llama3 model)"""
    data = event.data
    raw_app = data.get("app", "Unknown")
    raw_title = data.get("title", "Unknown")
    app = raw_app.lower()
    title = raw_title.lower()

    meeting_keywords = ['zoom', 'teams', 'meet', 'webex', 'skype', 'facetime']
    
    if any(keyword in app or keyword in title for keyword in meeting_keywords):
        return 'meeting'
    
    browsers = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'vivaldi']
    if any(browser in app for browser in browsers):
        return 'browser'
    
    dev_tools = ['code', 'vscode', 'intellij', 'pycharm', 'sublime', 'atom', 'terminal']
    
    if any(tool in app for tool in dev_tools):
        return 'work_related'
    
    cache_key = (app, title)
    if cache_key in CATEGORIZATION_CACHE:
        return CATEGORIZATION_CACHE[cache_key]
    
    prompt = f"""
        You are categorizing the currently active window during work or meeting time.

        Categorize it as **exactly one** of these four options:
        - 'meeting'     → video calls, online meetings, conferencing apps (Zoom, Teams, Meet, etc.)
        - 'work_related' → any productivity, coding, documents, work email, work browser tabs, IDEs, code editors
        - 'distraction' → entertainment, social media, videos, games, shopping, non-work browsing  
        - 'browser' → chrome, firefox, safari, edge, brave, opera, vivaldi
        - 'other'       → everything else (system windows, idle, unknown, etc.)

        **Important Rules:**
        - Code editors (VS Code, IntelliJ, etc.) and development files should ALWAYS be 'work_related'
        - The word "meeting" in a filename or project name does NOT make it a meeting app
        - Only actual video conferencing/meeting apps should be 'meeting'

        Strong indicators for 'meeting':
        - App names: zoom, teams, meet, webex, slack huddle, discord (when in call), facetime, skype, google meet, zoom.us
        - Window titles with meeting context: "Zoom Meeting", "Microsoft Teams meeting", "Join Meeting", "Video Call with", "Conference Room"

        Examples:
        App: Code              Title: FocusTimeLine.tsx — meeting-focus-tracker    → work_related
        App: Visual Studio Code Title: my-project/src/components/Meeting.js        → work_related  
        App: zoom.us           Title: Zoom Meeting with Team X                    → meeting
        App: Teams             Title: Microsoft Teams | Daily Standup            → meeting
        App: Google Chrome     Title: UX on Sean - Trello                        → work_related
        App: chrome            Title: YouTube - funny cat video                  → distraction

        App name: {app}
        Window title: {title}

        Respond **only** with one lowercase word: meeting, browser, work_related, distraction or other.
        No explanation, no quotes, no extra text.
        """
    
    try:
        response = ollama.chat(model='llama3', messages=[{'role': 'user', 'content': prompt}])['message']['content'].strip().lower()
        if response in ['meeting', 'work_related', 'distraction', 'other']:
            CATEGORIZATION_CACHE[cache_key] = response
            return response
        else:
            return 'other'  
    except Exception as e:
        print(f"LLM categorization error: {e}")
        return 'other'  

def compute_overlap(event_start, event_end, bin_start, bin_end):
    overlap_start = max(event_start, bin_start)
    overlap_end = min(event_end, bin_end)
    return max(0, (overlap_end - overlap_start).total_seconds())

def analyze_meeting(start_iso: str, end_iso: str):
    CATEGORIZATION_CACHE.clear()
    start = datetime.fromisoformat(start_iso).astimezone(timezone.utc)
    end = datetime.fromisoformat(end_iso).astimezone(timezone.utc)
    
    events = get_meeting_events(start, end)
    if not events:
        print("No window events found in time range.")
        return None, None, None, None, None, None
    
    total_duration_sec = (end - start).total_seconds()
    category_durations = defaultdict(float)
    event_details = []  
    focus_durs = []  
    current_focus_start = None
    hkt_tz = timezone(timedelta(hours=8))  
    
    for ev in events:
        cat = categorize_window_event(ev)
        dur_sec = ev.duration.total_seconds() if ev.duration else 10  
        
        category_durations[cat] += dur_sec
        event_details.append({
            'cat': cat,
            'app': ev.data.get('app', 'Unknown'),
            'title': ev.data.get('title', 'Untitled'),
            'dur_sec': dur_sec
        })
        
        if cat in ['meeting', 'work_related']:
            if current_focus_start is None:
                current_focus_start = ev.timestamp
        else:
            if current_focus_start is not None:
                focus_end = ev.timestamp
                focus_dur = (focus_end - current_focus_start).total_seconds()
                focus_durs.append(focus_dur)
                current_focus_start = None
    
    if current_focus_start is not None:
        focus_dur = (end - current_focus_start).total_seconds()
        focus_durs.append(focus_dur)
    
    start_rounded = start.replace(
        minute=(start.minute // 5) * 5,
        second=0,
        microsecond=0
    )
    
    avg_focus_sec = sum(focus_durs) / len(focus_durs) if focus_durs else 0
    
    interval_data = [] 
    current_bin = start_rounded
    while current_bin < end:
        bin_end = min(current_bin + timedelta(minutes=5), end)
        bin_total_sec = (bin_end - current_bin).total_seconds()

        if bin_total_sec <= 0:
            break

        bin_category_durations = defaultdict(float)
        dominant_app = "Unknown"
        dominant_title = "No activity"
        dominant_cat = "other"
        max_overlap = 0
        
        for ev in events:
            ev_start = ev.timestamp
            ev_end = ev_start + (ev.duration or timedelta(seconds=10))
            overlap = compute_overlap(ev_start, ev_end, current_bin, bin_end)
            if overlap > 0:
                cat = categorize_window_event(ev)
                bin_category_durations[cat] += overlap
                if overlap > max_overlap:
                    max_overlap = overlap
                    dominant_app = ev.data.get('app', 'Unknown')
                    dominant_title = ev.data.get('title', 'Untitled')
                    dominant_cat = cat

        engaged_sec = bin_category_durations.get('meeting', 0) + bin_category_durations.get('work_related', 0)
        engaged_pct = (engaged_sec / bin_total_sec * 100) if bin_total_sec > 0 else 0

        bin_label = current_bin.astimezone(hkt_tz).strftime('%H:%M')

        interval_data.append({
            'time': bin_label,
            'category': dominant_cat,
            'app': dominant_app,
            'title': dominant_title[:60] + '...' if len(dominant_title) > 60 else dominant_title,
            'engaged_pct': engaged_pct
        })

        current_bin = bin_end
    
    engaged_duration = category_durations['meeting'] + category_durations['work_related']
    engagement_pct = round(engaged_duration / total_duration_sec * 100, 1) if total_duration_sec > 0 else 0.0
    
    return total_duration_sec, engagement_pct, dict(category_durations), event_details, avg_focus_sec, interval_data