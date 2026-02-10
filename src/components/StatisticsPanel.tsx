import { motion } from "framer-motion";
import { Trophy, Clock, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { participants, getFocusPercentage } from "../data/meetingData";

const focusedCount = participants.filter(p => getFocusPercentage(p) >= 70).length;

const donutData = [
  { name: "Focused", value: focusedCount },
  { name: "Drifting", value: participants.length - focusedCount },
];
const DONUT_COLORS = ["hsl(122, 39%, 49%)", "hsl(40, 15%, 88%)"];

const categoryData = [
  { name: "Zoom Time", value: 65, fill: "hsl(122, 39%, 49%)" },
  { name: "Quick Breaks", value: 12, fill: "hsl(4, 90%, 58%)" },
  { name: "Deep Work", value: 10, fill: "hsl(280, 45%, 55%)" },
  { name: "Office", value: 8, fill: "hsl(200, 18%, 46%)" },
  { name: "Social", value: 5, fill: "hsl(36, 100%, 50%)" },
];

const StatisticsPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {/* Donut Chart */}
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Meeting-Focused</h3>
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
            <span className="text-2xl font-bold">{focusedCount}/{participants.length}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {focusedCount} out of {participants.length} stayed mostly present 🙌
        </p>
      </div>

      {/* Category Bar Chart */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Category Analysis</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryData} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
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
            <h3 className="text-sm font-semibold text-muted-foreground">Avg Focus Duration</h3>
          </div>
          <div className="text-3xl font-bold mb-2">15 min</div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "25%" }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-primary h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            That's longer than most coffee breaks! ☕
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-focus-amber" />
            <h3 className="text-sm font-semibold text-muted-foreground">Top Application</h3>
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Zoom Meeting
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Marvel switched apps 3× — maybe they were taking notes? 🤔
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatisticsPanel;
