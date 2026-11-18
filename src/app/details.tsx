import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { BrandText, Button, Screen, Sub, Title, TopBar } from '../components/ui';
import { useStore } from '../state/store';
import { C, F } from '../theme';

export default function Details() {
  const { name, setName } = useStore();
  const [value, setValue] = useState(name === 'Your name' ? '' : name);
  const save = () => { setName(value.trim() || 'Your name'); router.back(); };
  return (
    <Screen footer={<Button label="Save" disabled={!value.trim()} onPress={save} />}>
      <TopBar />
      <View style={{ marginTop: 20, gap: 8 }}>
        <Title>Edit my details</Title>
        <BrandText text="This is how Moi greets you." size={16} weight="regular" color={C.gray2} lineHeight={1.375} />
      </View>
      <TextInput value={value} onChangeText={setValue} placeholder="Your name" placeholderTextColor="#ABABAB" autoFocus autoComplete="given-name" onSubmitEditing={save}
        style={{ marginTop: 24, height: 58, borderRadius: 18, backgroundColor: C.option, paddingHorizontal: 18, fontFamily: F.regular, fontSize: 17, color: C.ink, outlineStyle: 'none' } as any} />
    </Screen>
  );
}
