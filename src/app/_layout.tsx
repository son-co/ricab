import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingState, Screen } from '../components/ui';
import { RequestsProvider, useRequests } from '../store/RequestsContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RequestsProvider>
        <RootNavigator />
      </RequestsProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { hydrated } = useRequests();

  if (!hydrated) {
    return (
      <Screen>
        <LoadingState label="Đang chuẩn bị ứng dụng..." />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
