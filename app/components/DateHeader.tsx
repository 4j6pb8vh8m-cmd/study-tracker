import { View, Text, StyleSheet } from "react-native";

const COLORS = {
  sub: "#9CA3AF",
  text: "#F9FAFB",
};

export default function DateHeader() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const weekdays = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
  const weekday = weekdays[d.getDay()];

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.date}>
        📅 {year} / {month} / {day}（{weekday}）
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  date: {
    color: COLORS.sub,
    fontSize: 14,
  },
});
