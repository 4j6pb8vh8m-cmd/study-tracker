import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  bg: "#050509",
  card: "#111118",
  cardSoft: "#181824",
  accent: "#FACC15",
  text: "#F9FAFB",
  sub: "#9CA3AF",
  border: "#27272F",
  danger: "#F97373",
};

type StudySession = {
  id: string;
  date: string;
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

const STORAGE_KEY_SESSIONS = "STUDY_SESSIONS_V1";
const STORAGE_KEY_GOALS = "DAILY_GOALS_V1";

const getTodayString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayLabel = () => {
  const d = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const w = weekdays[d.getDay()];
  return `${yyyy}年 ${mm}月 ${dd}日 ${w}`;
};

export default function HomeScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goalsMap, setGoalsMap] = useState<Record<string, DailyGoalItem[]>>({});
  const [isFormOpen, setIsFormOpen] = useState(true);

  const SUBJECTS = ["國文", "英文", "數學", "理化", "歷史", "地理", "公民"];
  const TYPES = ["讀課本", "寫題目", "背東西", "複習考卷", "其他"];

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [durationText, setDurationText] = useState("");
  const [type, setType] = useState(TYPES[1]);
  const [focus, setFocus] = useState(4);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newGoalTitle, setNewGoalTitle] = useState("");

  const today = getTodayString();
  const todayLabel = getTodayLabel();

  const todayGoals = goalsMap[today] ?? [];
  const visibleGoals = todayGoals.filter((g) => !g.done);
  const doneGoalsList = todayGoals.filter((g) => g.done);

  const totalGoals = todayGoals.length;
  const doneGoals = doneGoalsList.length;
  const goalProgress =
    totalGoals === 0 ? 0 : Math.min(doneGoals / totalGoals, 1);

  useEffect(() => {
    const load = async () => {
      try {
        const [sessionsJson, goalsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_SESSIONS),
          AsyncStorage.getItem(STORAGE_KEY_GOALS),
        ]);

        if (sessionsJson) setSessions(JSON.parse(sessionsJson));
        if (goalsJson) setGoalsMap(JSON.parse(goalsJson));
      } catch (e) {
        console.warn("載入失敗", e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions)).catch(
      () => {}
    );
  }, [sessions]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goalsMap)).catch(
      () => {}
    );
  }, [goalsMap]);

  const resetForm = () => {
    setSubject(SUBJECTS[0]);
    setDurationText("");
    setType(TYPES[1]);
    setFocus(4);
    setNote("");
    setEditingId(null);
  };

  const sessionsToday = sessions.filter((s) => s.date === today);
  const totalMinutesToday = sessionsToday.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  const updateTodayGoals = (
    updater: (prev: DailyGoalItem[]) => DailyGoalItem[]
  ) => {
    setGoalsMap((prev) => {
      const current = prev[today] ?? [];
      const next = updater(current);
      return { ...prev, [today]: next };
    });
  };

  // 讀書紀錄新增/更新
  const handleSubmitSession = () => {
    const duration = parseInt(durationText || "0", 10);

    if (!duration || duration <= 0) {
      Alert.alert("提醒", "請輸入大於 0 的分鐘數");
      return;
    }

    if (editingId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, subject, duration, type, focus, note }
            : s
        )
      );
    } else {
      const newSession: StudySession = {
        id: Date.now().toString(),
        date: today,
        subject,
        duration,
        type,
        focus,
        note,
      };
      setSessions((prev) => [newSession, ...prev]);
    }

    resetForm();
  };

  const handleEditSession = (s: StudySession) => {
    setSubject(s.subject);
    setDurationText(String(s.duration));
    setType(s.type);
    setFocus(s.focus);
    setNote(s.note);
    setEditingId(s.id);
    setIsFormOpen(true);
  };

  const handleDeleteSession = (id: string) => {
    Alert.alert("刪除紀錄", "確定要刪掉嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: () =>
          setSessions((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  };

  // 今日目標：新增
  const handleAddGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;

    updateTodayGoals((list) => [
      { id: Date.now().toString(), title, done: false },
      ...list,
    ]);
    setNewGoalTitle("");
  };

  // 今日目標：完成（標記 done = true，從未完成區消失，但保留在資料中）
  const handleToggleGoal = (id: string) => {
    updateTodayGoals((list) =>
      list.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    );
  };

  // 今日目標：刪除（真的從資料中移除，用於不小心按到完成時修正）
  const handleDeleteGoal = (id: string) => {
    updateTodayGoals((list) => list.filter((g) => g.id !== id));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.dateLabel}>{todayLabel}</Text>

      {/* 今日總時間卡片 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>今日讀書總時間</Text>

        <Text style={styles.bigNumber}>
          {Math.floor(totalMinutesToday / 60)} 小時 {totalMinutesToday % 60} 分
        </Text>

        <Text style={styles.subText}>
          今日目標：{totalGoals} 項（已完成 {doneGoals} 項）
        </Text>

        <View className="progress">
          <View style={styles.goalBarWrapper}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${goalProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.goalPercent}>
            {Math.round(goalProgress * 100)}%
          </Text>
        </View>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => setIsFormOpen((o) => !o)}
        >
          <Text style={styles.mainButtonText}>
            {isFormOpen ? "隱藏讀書紀錄表單" : "＋ 新增讀書紀錄"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 讀書紀錄表單 */}
      {isFormOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>讀書紀錄表單</Text>

          <Text style={styles.label}>科目</Text>
          <View style={styles.chipRow}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, subject === s && styles.chipSelected]}
                onPress={() => setSubject(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    subject === s && styles.chipTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>讀書時間（分鐘）</Text>
          <TextInput
            style={styles.input}
            placeholder="例如 45"
            placeholderTextColor={COLORS.sub}
            keyboardType="numeric"
            value={durationText}
            onChangeText={setDurationText}
          />
          <View style={styles.chipRow}>
            {[15, 30, 45, 60, 90].map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.chip,
                  durationText === String(m) && styles.chipSelected,
                ]}
                onPress={() => setDurationText(String(m))}
              >
                <Text
                  style={[
                    styles.chipText,
                    durationText === String(m) && styles.chipTextSelected,
                  ]}
                >
                  {m} 分
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>讀書類型</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipSelected]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[
                    styles.chipText,
                    type === t && styles.chipTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>專注程度（1~5）</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, focus === n && styles.chipSelected]}
                onPress={() => setFocus(n)}
              >
                <Text
                  style={[
                    styles.chipText,
                    focus === n && styles.chipTextSelected,
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>備註（可空白）</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            multiline
            placeholder="今天的感受、遇到的難題…"
            placeholderTextColor={COLORS.sub}
            value={note}
            onChangeText={setNote}
          />

          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.mainButton, { flex: 1 }]}
              onPress={handleSubmitSession}
            >
              <Text style={styles.mainButtonText}>
                {editingId ? "更新紀錄" : "儲存紀錄"}
              </Text>
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}
              >
                <Text style={styles.secondaryButtonText}>取消</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 今日目標 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>今日目標</Text>
        <Text style={styles.subText}>
          共 {totalGoals} 項 · 已完成 {doneGoals} 項
        </Text>

        {/* 新增目標 */}
        <View style={[styles.goalInputRow, { marginTop: 12 }]}>
          <Text style={styles.plusIcon}>＋</Text>
          <TextInput
            style={styles.goalInput}
            placeholder="輸入一個新目標，例如：國文 30 分"
            placeholderTextColor={COLORS.sub}
            value={newGoalTitle}
            onChangeText={setNewGoalTitle}
            onSubmitEditing={handleAddGoal}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAddGoal}>
            <Text style={styles.addButtonText}>新增</Text>
          </TouchableOpacity>
        </View>

        {/* 未完成目標 */}
        {visibleGoals.length === 0 ? (
          <Text style={[styles.emptyText, { marginTop: 10 }]}>
            沒有未完成的目標了，讚！ 🎉
          </Text>
        ) : (
          visibleGoals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <TouchableOpacity
                onPress={() => handleToggleGoal(g.id)}
                style={styles.goalCheck}
              />
              <Text
                style={styles.goalText}
                onPress={() => handleToggleGoal(g.id)}
              >
                {g.title}
              </Text>

              <TouchableOpacity onPress={() => handleDeleteGoal(g.id)}>
                <Text style={styles.goalDeleteText}>刪除</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* 已完成目標（可刪除紀錄） */}
        {doneGoalsList.length > 0 && (
          <>
            <Text
              style={[
                styles.subText,
                { marginTop: 14, marginBottom: 4 },
              ]}
            >
              已完成目標（只顯示今天的，隔天自動隱藏；成就會照樣紀錄）
            </Text>
            {doneGoalsList.map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <View style={[styles.goalCheck, styles.goalCheckDone]}>
                  <Text style={styles.goalCheckMark}>✓</Text>
                </View>
                <Text style={[styles.goalText, styles.goalTextDone]}>
                  {g.title}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteGoal(g.id)}>
                  <Text style={styles.goalDeleteText}>刪除紀錄</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>

      {/* 今天的紀錄 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>今天的紀錄</Text>

        {sessionsToday.length === 0 ? (
          <Text style={styles.emptyText}>今天還沒有紀錄 📘</Text>
        ) : (
          sessionsToday.map((s) => (
            <View key={s.id} style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                {s.subject} · {s.type}（{s.duration} 分）
              </Text>
              <Text style={styles.sessionSub}>專注：{s.focus}/5</Text>
              {s.note ? (
                <Text style={styles.sessionNote}>備註：{s.note}</Text>
              ) : null}

              <View style={styles.sessionActions}>
                <TouchableOpacity onPress={() => handleEditSession(s)}>
                  <Text style={styles.actionText}>編輯</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteSession(s.id)}>
                  <Text style={[styles.actionText, { color: COLORS.danger }]}>
                    刪除
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  dateLabel: {
    color: COLORS.sub,
    fontSize: 14,
    marginBottom: 10,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },

  bigNumber: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 10,
  },

  subText: {
    color: COLORS.sub,
    fontSize: 13,
    marginTop: 8,
  },

  goalBarWrapper: {
    width: "100%",
    height: 10,
    backgroundColor: COLORS.cardSoft,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  goalBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  goalPercent: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 4,
  },

  mainButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginTop: 14,
    alignSelf: "flex-start",
  },
  mainButtonText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },

  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.sub,
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: COLORS.sub,
    fontSize: 13,
    fontWeight: "600",
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  label: {
    color: COLORS.sub,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },

  input: {
    backgroundColor: COLORS.cardSoft,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.sub,
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#111827",
    fontWeight: "700",
  },

  emptyText: {
    color: COLORS.sub,
    fontSize: 14,
    marginTop: 6,
  },

  // 今日目標
  goalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  plusIcon: {
    color: COLORS.sub,
    fontSize: 18,
    marginRight: 6,
  },
  goalInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 4,
  },
  addButtonText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  goalCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.sub,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  goalCheckDone: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  goalCheckMark: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  goalText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  goalTextDone: {
    color: COLORS.sub,
    textDecorationLine: "line-through",
  },
  goalDeleteText: {
    color: COLORS.sub,
    fontSize: 12,
    marginLeft: 8,
  },

  // 今日紀錄卡片
  sessionCard: {
    backgroundColor: COLORS.cardSoft,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  sessionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  sessionSub: {
    color: COLORS.sub,
    marginTop: 4,
    fontSize: 13,
  },
  sessionNote: {
    color: COLORS.sub,
    marginTop: 4,
    fontSize: 13,
  },
  sessionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionText: {
    color: COLORS.accent,
    fontSize: 13,
    marginLeft: 12,
  },
});
