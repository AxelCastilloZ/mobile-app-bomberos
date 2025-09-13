// login.tsx (esqueleto mínimo)
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';

export default function Login() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={64} // aprox. alto del header
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* tu formulario actual */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
