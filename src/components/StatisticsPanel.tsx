import { motion } from "framer-motion";
import { Trophy, Clock, Sparkles } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

interface MeetingData {
  total_duration_sec: number;
  engagement_percentage: number;
  category_durations: {
    meeting?: number;
    work_related?: number;
    distraction?: number;
    other?: number;
  };
  avg_focus_seconds: number;
  interval_data: Array<{
    time: string;
    category: string;
    app: string;
    title: string;
    engaged_pct: number;
  }>;
}

interface StatisticsPanelProps {
  meetingData: MeetingData;
}

const DONUT_COLORS = ["hsl(122, 39%, 49%)", "hsl(40, 15%, 88%)"];

const StatisticsPanel = ({ meetingData }: StatisticsPanelProps) => {
  const {
    category_durations,
    engagement_percentage,
    avg_focus_seconds,
    total_duration_sec,
  } = meetingData;

  // Calculate focused count based on engagement percentage
  const focusedCount = engagement_percentage >= 70 ? 3 : 2; // You can adjust this logic
  const totalParticipants = 4;

  // Prepare donut chart data
  const donutData = [
    { name: "Focused", value: focusedCount },
    { name: "Drifting", value: totalParticipants - focusedCount },
  ];

  // Prepare category data for bar chart
  const categoryData = [];

  if (category_durations.meeting) {
    categoryData.push({
      name: "Meeting",
      value: Math.round(
        (category_durations.meeting / total_duration_sec) * 100,
      ),
      fill: "hsl(122, 39%, 49%)",
    });
  }

  if (category_durations.work_related) {
    categoryData.push({
      name: "Work",
      value: Math.round(
        (category_durations.work_related / total_duration_sec) * 100,
      ),
      fill: "hsl(200, 18%, 46%)",
    });
  }

  if (category_durations.distraction) {
    categoryData.push({
      name: "Distraction",
      value: Math.round(
        (category_durations.distraction / total_duration_sec) * 100,
      ),
      fill: "hsl(4, 90%, 58%)",
    });
  }

  if (category_durations.other) {
    categoryData.push({
      name: "Other",
      value: Math.round((category_durations.other / total_duration_sec) * 100),
      fill: "hsl(40, 15%, 88%)",
    });
  }

  // Find top application from interval_data
  const appFrequency: Record<string, number> = {};
  meetingData.interval_data.forEach((item) => {
    const cleanApp =
      item.app.split("\\").pop()?.split("/").pop()?.split(".")[0] || item.app;
    appFrequency[cleanApp] = (appFrequency[cleanApp] || 0) + 1;
  });

  const topApp =
    Object.entries(appFrequency).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "Unknown App";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {/* Donut Chart */}
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Meeting-Focused
        </h3>
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">
              {focusedCount}/{totalParticipants}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {focusedCount} out of {totalParticipants} stayed mostly present 🙌
        </p>
      </div>

      {/* Category Bar Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Category Analysis
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryData} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <RechartsTooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
              formatter={(value: number | undefined) => [`${value}%`, "Time"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col gap-4">
        <div className="glass-card rounded-2xl p-5 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              Avg Focus Duration
            </h3>
          </div>
          <div className="text-3xl font-bold mb-2">
            {Math.round(avg_focus_seconds / 60)} min
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (avg_focus_seconds / 60) * 4)}%`,
              }} // Adjust scaling as needed
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-primary h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {avg_focus_seconds > 900
              ? "Great focus streak!"
              : "Keep building your focus!"}{" "}
            ☕
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-focus-amber" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              Top Application
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {topApp}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {meetingData.interval_data.length > 0
              ? `You switched apps ${meetingData.interval_data.length} times during the meeting`
              : "No app switching detected"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatisticsPanel;
