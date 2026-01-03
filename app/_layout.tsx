import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 把整個 (tabs) 群組包起來，但完全不顯示上方白色標題列 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
