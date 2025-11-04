import { Redirect } from "expo-router";

export default function HomeTab() {
  // Send the Home tab directly to your prototype screen
  return <Redirect href="/tab" />;
}
