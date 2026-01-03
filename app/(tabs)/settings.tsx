import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const COLORS = {
  bg: "#050509",
  card: "#111118",
  cardSoft: "#181824",
  accent: "#FACC15",
  text: "#F9FAFB",
  sub: "#9CA3AF",
  border: "#27272F",
};

const STORAGE_KEY_SESSIONS = "STUDY_SESSIONS_V1";
const STORAGE_KEY_GOALS = "DAILY_GOALS_V1";

type StudySession = {
  id: string;
  date: string; // yyyy-mm-dd
  subject: string;
  duration: number;
  type: string;
  focus: number;
  note: string;
};

type DailyGoalItem = {
  id: string;
  title: string;
  done: boolean;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

// yyyy-mm-dd
const toYMD = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 本週一～本週日
const getThisWeekBounds = () => {
  const today = new Date();
  const day = today.getDay(); // 0(日)~6(六)
  const diffToMonday = (day + 6) % 7; // 讓週一是開始

  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = toYMD(monday);
  const end = toYMD(sunday);

  const label = `本週 (${monday.getMonth() + 1}/${monday.getDate()}–${
    sunday.getMonth() + 1
  }/${sunday.getDate()})`;

  return { start, end, label };
};

export default function SettingsScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goalsMap, setGoalsMap] = useState<Record<string, DailyGoalItem[]>>(
    {}
  );
  const [weekLabel, setWeekLabel] = useState("");

  const { start: weekStart, end: weekEnd, label } = getThisWeekBounds();

  const isInThisWeek = (dateStr: string) =>
    dateStr >= weekStart && dateStr <= weekEnd;

  const loadData = useCallback(async () => {
    try {
      const [sessionsJson, goalsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_SESSIONS),
        AsyncStorage.getItem(STORAGE_KEY_GOALS),
      ]);

      if (sessionsJson) setSessions(JSON.parse(sessionsJson));
      if (goalsJson) setGoalsMap(JSON.parse(goalsJson));

      setWeekLabel(label);
    } catch (e) {
      console.log("load settings data error", e);
    }
  }, [label]);

  // 第一次進來載入一次
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 每次 tab 切到 settings 再載入一次（確保是最新）
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 本週讀書紀錄
  const weeklySessions = sessions.filter((s) => isInThisWeek(s.date));
  const weeklyStudyMinutes = weeklySessions.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const weeklyStudyDays = new Set(weeklySessions.map((s) => s.date)).size;

  // 本週目標（包含已完成＋未完成）
  const weeklyGoals: DailyGoalItem[] = Object.entries(goalsMap)
    .filter(([date]) => isInThisWeek(date))
    .flatMap(([_, list]) => list);

  const weeklyTotalGoals = weeklyGoals.length;
  const weeklyDoneGoals = weeklyGoals.filter((g) => g.done).length;

  const achievements: Achievement[] = [
    {
      id: "weekly_first_goal",
      title: "本週出手",
      description: "本週內完成 1 個今日目標",
      unlocked: weeklyDoneGoals >= 1,
    },
    {
      id: "weekly_goal_hunter",
      title: "本週目標達人",
      description: "本週內累積完成 7 個今日目標",
      unlocked: weeklyDoneGoals >= 7,
    },
    {
      id: "weekly_60",
      title: "本週暖身",
      description: "本週累積讀書時間達 60 分鐘",
      unlocked: weeklyStudyMinutes >= 60,
    },
    {
      id: "weekly_300",
      title: "穩定輸出 300",
      description: "本週累積讀書時間達 300 分鐘",
      unlocked: weeklyStudyMinutes >= 300,
    },
    {
      id: "weekly_days_3",
      title: "三天行動",
      description: "本週有 3 天以上有讀書紀錄",
      unlocked: weeklyStudyDays >= 3,
    },
    {
      id: "weekly_days_5",
      title: "本週狠角色",
      description: "本週有 5 天以上有讀書紀錄",
      unlocked: weeklyStudyDays >= 5,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 標題區 */}
      <Text style={styles.title}>本週成就 & 統計</Text>
      <Text style={styles.subtitle}>{weekLabel}</Text>

      {/* 本週統計卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>本週學習總覽</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {Math.floor(weeklyStudyMinutes / 60)}
            </Text>
            <Text style={styles.statLabel}>本週總時數（小時）</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{weeklyStudyDays}</Text>
            <Text style={styles.statLabel}>本週有紀錄的天數</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{weeklyDoneGoals}</Text>
            <Text style={styles.statLabel}>本週完成目標數</Text>
          </View>
        </View>

        <Text style={styles.smallInfo}>
          本週累積讀書 {weeklyStudyMinutes} 分鐘 · 設定 {weeklyTotalGoals} 個目標
        </Text>
      </View>

      {/* 成就徽章卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>本週成就徽章</Text>
        <Text style={styles.smallInfo}>
          已解鎖 {unlockedCount} / {achievements.length} 個勳章
        </Text>

        {achievements.map((a) => (
          <View
            key={a.id}
            style={[
              styles.achievementRow,
              a.unlocked && styles.achievementRowUnlocked,
            ]}
          >
            <View
              style={[
                styles.achievementDot,
                a.unlocked && styles.achievementDotUnlocked,
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.achievementTitle,
                  a.unlocked && styles.achievementTitleUnlocked,
                ]}
              >
                {a.title} {a.unlocked ? "✨" : ""}
              </Text>
              <Text
                style={[
                  styles.achievementDesc,
                  !a.unlocked && styles.achievementDescLocked,
                ]}
              >
                {a.description}
              </Text>
            </View>
            <Text
              style={[
                styles.achievementStatus,
                a.unlocked && styles.achievementStatusUnlocked,
              ]}
            >
              {a.unlocked ? "已解鎖" : "未解鎖"}
            </Text>
          </View>
        ))}
      </View>

      {/* 提示卡片 */}
      <View style={styles.cardSoftBox}>
        <Text style={styles.tipTitle}>每週刷新規則</Text>
        <Text style={styles.tipText}>・只計算「本週一～本週日」的紀錄</Text>
        <Text style={styles.tipText}>・下週會自動重新開始累積成就</Text>
        <Text style={styles.tipText}>・舊的紀錄不會消失，只是本週不拿來算</Text>
        <Text style={[styles.tipText, { marginTop: 6 }]}>
          可以把每一週當成一個新賽季，看看這週能拿下多少勳章 🏆
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.sub,
    fontSize: 13,
    marginBottom: 18,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSoftBox: {
    backgroundColor: COLORS.cardSoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.sub,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  smallInfo: {
    color: COLORS.sub,
    fontSize: 12,
    marginTop: 10,
  },

  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginTop: 6,
    backgroundColor: "transparent",
  },
  achievementRowUnlocked: {
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  achievementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.sub,
    marginRight: 10,
  },
  achievementDotUnlocked: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  achievementTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  achievementTitleUnlocked: {
    color: COLORS.accent,
  },
  achievementDesc: {
    color: COLORS.sub,
    fontSize: 12,
    marginTop: 2,
  },
  achievementDescLocked: {
    opacity: 0.85,
  },
  achievementStatus: {
    color: COLORS.sub,
    fontSize: 11,
    marginLeft: 8,
  },
  achievementStatusUnlocked: {
    color: COLORS.accent,
    fontWeight: "700",
  },

  tipTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  tipText: {
    color: COLORS.sub,
    fontSize: 13,
    marginTop: 2,
  },
});