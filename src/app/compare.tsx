import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Chip, Screen, Sub, TopBar } from '../components/ui';
import { ANGLES, type Angle, loadScanSessions, type ScanSession } from '../lib/scans';
import { C, F } from '../theme';

const short = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** First vs latest photo from the same angle, large, so small changes at the hairline or crown are visible. */
export default function Compare() {
  const [angle, setAngle] = useState<Angle>('crown');
  const [sessions, setSessions] = useState<ScanSession[] | null>(null);
  useEffect(() => { loadScanSessions().then(setSessions).catch(() => setSessions([])); }, []);
  const withAngle = (sessions ?? []).filter(s => s.photos[angle]);
  const pair = withAngle.length > 1 ? [withAngle[0], withAngle[withAngle.length - 1]] : withAngle;
  const days = pair.length === 2 ? Math.round((new Date(pair[1].at).getTime() - new Date(pair[0].at).getTime()) / 86400000) : 0;

  return (
    <Screen scroll>
      <TopBar />
      <Text style={{ fontFamily: F.semibold, fontSize: 18, color: C.ink, textAlign: 'center', marginTop: -36, marginBottom: 18 }}>Compare</Text>
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
        {ANGLES.map(a => <Chip key={a.id} label={a.title} on={a.id === angle} onPress={() => setAngle(a.id)} />)}
      </View>
      {pair.length ? (
        <>
          {days ? <Sub style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>{days} days apart, same angle</Sub> : null}
          <View style={{ gap: 12, marginTop: 14 }}>
            {pair.map((s, i) => (
              <View key={s.id} style={{ aspectRatio: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0A0A0A' }}>
                <Image source={{ uri: s.photos[angle] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ position: 'absolute', left: 12, bottom: 12, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.ink }}>{i === 0 ? 'First' : 'Latest'} · {short(s.at)}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : <Sub style={{ textAlign: 'center', marginTop: 40 }}>{sessions === null ? 'Loading photos…' : `No ${ANGLES.find(a => a.id === angle)!.title.toLowerCase()} photos yet. They appear after your next scan.`}</Sub>}
    </Screen>
  );
}
