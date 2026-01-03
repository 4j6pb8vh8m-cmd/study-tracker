import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

const COLORS = {
  bg: "#050509",          // 全局背景
  iconActive: "#F9FAFB",  // 選中：幾乎白色
  iconInactive: "#6B7280" // 未選中：灰色
};

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        // ⭐ 底部改成像 IG：扁平、只有 icon
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingTop: Platform.OS === "ios" ? 8 : 4,
          paddingBottom: Platform.OS === "ios" ? 18 : 10,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home-outline"
              size={30}
              color={focused ? COLORS.iconActive : COLORS.iconInactive}
            />
          ),
        }}
      />

      {/* Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="paper-plane-outline"
              size={28}
              color={focused ? COLORS.iconActive : COLORS.iconInactive}
            />
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="trophy-outline"
              size={28}
              color={focused ? COLORS.iconActive : COLORS.iconInactive}
            />
          ),
        }}
      />
    </Tabs>
  );
}
