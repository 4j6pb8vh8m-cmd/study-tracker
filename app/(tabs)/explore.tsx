import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateHeader from "../components/DateHeader";
import { useFocusEffect } from "@react-navigation/native";

const STORAGE_KEY = "STUDY_SESSIONS_V1";
const GOAL_KEY = "DAILY_GOAL_V1";

// 黑金色系
const COLORS = {
  bg: "#050509",
  card: "#111118",
  cardSoft: "#181824",
  text: "#F9FAFB",
  sub: "#9CA3AF",
  accent: "#FACC15",
  border: "#27272F",
};

// 型別
type StudySession = {
  id: string;
  date: string;
  subject: string;
  duration: number;
  type: string;
  focus: number;
  note: string;
};

// 日期格式
const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 取得本週（週一）
const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 星期日需往回 6 天
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
};

export default function ExploreScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [dailyGoal, setDailyGoal] = useState(120);

  const today = new Date();
  const monday = getMonday(today);

  // 本週 7 天日期（週一～週日）
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatDate(d);
  });

  // 🌟 自動更新資料（每次切到 Explore 都重新讀取）
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setSessions(JSON.parse(json));

        const goal = await AsyncStorage.getItem(GOAL_KEY);
        if (goal) setDailyGoal(Number(goal));
      };
      load();
    }, [])
  );

  // 本週資料
  const weekSessions = sessions.filter((s) =>
    weekDates.includes(s.date)
  );

  const totalWeekMinutes = weekSessions.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  // 每日分鐘（長條圖用）
  const dayMinutes = weekDates.map((d) =>
    weekSessions
      .filter((s) => s.date === d)
      .reduce((sum, s) => sum + s.duration, 0)
  );

  // A 版：平均高度 → 全部壓縮在 0~100%
  const maxMinutes = Math.max(...dayMinutes, 1);
  const barHeights = dayMinutes.map((m) =>
    Math.round((m / maxMinutes) * 100)
  );

  // 科目統計
  const subjectTotals: Record<string, number> = {};
  weekSessions.forEach((s) => {
    subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.duration;
  });

  const subjects = Object.keys(subjectTotals);

  // 週標籤
  const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 100 }}
    >
      <DateHeader />

      {/* 本週總覽 */}
      <View style={styles.card}>
        <Text style={styles.title}>本週總覽（週一 ~ 週日）</Text>

        <Text style={styles.big}>
          {Math.floor(totalWeekMinutes / 60)} 小時 {totalWeekMinutes % 60} 分
        </Text>

        <Text style={styles.sub}>
          本週共 {weekSessions.length} 筆讀書紀錄
        </Text>
      </View>

      {/* 長條圖 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📊 每日讀書長條圖</Text>

        <View style={styles.barsWrapper}>
          {barHeights.map((h, idx) => (
            <View key={idx} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  { height: `${h}%` },
                ]}
              />
              <Text style={styles.barLabel}>{weekLabels[idx]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 科目統計 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📘 本週各科統計</Text>

        {subjects.length === 0 && (
          <Text style={styles.sub}>本週還沒有紀錄</Text>
        )}

        {subjects.map((subj) => (
          <View key={subj} style={styles.subjectRow}>
            <Text style={styles.subjectText}>{subj}</Text>

            <Text style={styles.subjectTime}>
              {subjectTotals[subj]} 分
            </Text>

            <View style={styles.smallBarWrapper}>
              <View
                style={[
                  styles.smallBarFill,
                  {
                    width: `${Math.min(
                      (subjectTotals[subj] / totalWeekMinutes) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

//
// ─── 樣式 ─────────────────────────────────────────────────────────
//

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginBottom: 20,
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },

  big: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },

  sub: {
    color: COLORS.sub,
    fontSize: 13,
    marginTop: 6,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  //
  // 長條圖
  //
  barsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    marginTop: 10,
  },

  barContainer: {
    alignItems: "center",
    width: "12%",
  },

  bar: {
    width: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },

  barLabel: {
    color: COLORS.sub,
    fontSize: 13,
    marginTop: 4,
  },

  //
  // 科目統計
  //
  subjectRow: {
    marginBottom: 16,
  },

  subjectText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },

  subjectTime: {
    color: COLORS.accent,
    fontSize: 13,
    marginTop: 4,
  },

  smallBarWrapper: {
    width: "100%",
    height: 6,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
  },

  smallBarFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
  },
});
