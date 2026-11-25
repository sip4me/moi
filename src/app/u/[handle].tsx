import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, Text, View } from 'react-native';
import { AffiliateNote, Btn, Bubble, Shell, SYS } from '../../components/routine/Kit';
import { asItem } from '../../components/routine/Social';
import { storeLinks } from '../../lib/routine/affiliate';
import { getPage, isFollowing, pageUrl, setFollow, stepCount, type Page } from '../../lib/routine/social';
import { ensureUser } from '../../lib/supabase';
import { useStore } from '../../state/store';
import { F } from '../../theme';

const crown = require('../../../assets/crown-pink.png');

/** A person's public routine page: usemoi.com/u/<handle>. Anyone can view; signed-in people can follow it. */
export default function RoutinePage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { account } = useStore();
  const signedIn = !!account && !account.anonymous;
  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const [me, setMe] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    getPage(String(handle ?? '')).then(async p => {
      if (!alive) return;
      setPage(p);
      if (p && signedIn) { setMe(await ensureUser()); setOn(await isFollowing(p.user_id)); }
    }).catch(() => alive && setPage(null));
    return () => { alive = false; };
  }, [handle, signedIn]);

  const mine = !!page && me === page.user_id;
  const follow = async () => {
    if (!page) return;
    if (!signedIn) { router.push({ pathname: '/sign-in', params: { mode: 'signup', next: `/u/${page.handle}` } }); return; }
    setBusy(true);
    if (await setFollow(page.user_id, !on)) { setOn(!on); setPage({ ...page, followers: (page.followers ?? 0) + (on ? -1 : 1) }); }
    setBusy(false);
  };
  const share = async () => {
    if (!page) return;
    const url = pageUrl(page.handle);
    try {
      if (Platform.OS === 'web' && (navigator as any).share) { await (navigator as any).share({ title: `${page.name ?? page.handle}'s routine on Moi`, url }); return; }
      await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* closed */ }
  };

  const T = { fontFamily: SYS ?? F.medium, fontSize: 13, lineHeight: 18, color: '#4A4858' };
  if (page === undefined) return <Shell glass><ActivityIndicator color="#6C6A80" style={{ marginTop: 60 }} /></Shell>;
  if (!page || (!page.is_public && !mine)) {
    return (
      <Shell glass>
        <View style={{ gap: 12, maxWidth: 480, alignSelf: 'center', alignItems: 'center', marginTop: 40, padding: 24, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' }}>
          <Image source={crown} style={{ width: 64, height: 64, opacity: 0.5 }} resizeMode="contain" />
          <Text style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 20, color: '#111114' }}>This routine isn’t public</Text>
          <Text style={[T, { textAlign: 'center' }]}>The link may be wrong, or its owner made it private.</Text>
          <Btn label="Build my own routine" onPress={() => router.replace('/routine/welcome')} />
        </View>
      </Shell>
    );
  }

  return (
    <Shell glass>
      <View style={{ gap: 14, maxWidth: 560, alignSelf: 'center', width: '100%' }}>
        <View style={{ alignItems: 'center', gap: 6, padding: 20, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', ...({ backdropFilter: 'blur(22px)' } as any) }}>
          <Image source={crown} style={{ width: 52, height: 52, transform: [{ rotate: '-14deg' }] }} resizeMode="contain" />
          <Text {...({ dataSet: { grad: 'title' } } as any)} style={{ fontFamily: SYS ?? F.bold, fontWeight: '700', fontSize: 22, color: '#111114', textAlign: 'center' }}>{page.name || `@${page.handle}`}</Text>
          <Text style={[T, { color: '#6C6A80' }]}>{[`@${page.handle}`, `${stepCount(page.routine)} products`, `${page.followers ?? 0} follower${page.followers === 1 ? '' : 's'}`].join(' · ')}</Text>
          {page.bio ? <Text style={[T, { textAlign: 'center' }]}>{page.bio}</Text> : null}
          {!page.is_public && mine ? <Text style={[T, { color: '#A8576A' }]}>Only you can see this. Make it public from your profile.</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {mine ? <Btn kind="small" label="Edit my page" onPress={() => router.push('/routine/profile')} /> : <Btn kind="small" label={busy ? '…' : on ? 'Following' : 'Follow routine'} onPress={busy ? undefined : follow} />}
            <Btn kind="small" label={copied ? 'Link copied' : 'Share'} onPress={share} />
          </View>
        </View>

        {page.routine?.look ? (
          <View style={{ gap: 4, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '700', fontSize: 15, color: '#111114' }}>{page.routine.look.name}</Text>
            {page.routine.look.summary ? <Text style={T}>{page.routine.look.summary}</Text> : null}
          </View>
        ) : null}

        {(page.routine?.groups ?? []).map(g => (
          <View key={g.where} style={{ gap: 10, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.75)' }}>
            <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: '#6C6A80' }}>{g.where}</Text>
            {g.steps.map((x, n) => {
              const link = storeLinks(asItem(x))[0];
              return (
                <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Bubble category={x.category} item={asItem(x)} size={34} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={{ fontFamily: SYS ?? F.medium, fontSize: 11, color: '#6C6A80' }}>{x.label}</Text>
                    <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 13, lineHeight: 17, color: '#111114' }}>{x.name}</Text>
                  </View>
                  {link ? (
                    <Pressable onPress={() => Linking.openURL(link.url)} accessibilityRole="link" accessibilityLabel={`Shop ${x.name} at ${link.name}`} hitSlop={6}
                      style={{ paddingHorizontal: 10, height: 28, borderRadius: 14, justifyContent: 'center', backgroundColor: '#F1F3F5' }}>
                      <Text style={{ fontFamily: SYS ?? F.semibold, fontWeight: '600', fontSize: 12, color: '#111114' }}>Shop ↗</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
        {!stepCount(page.routine) ? <Text style={[T, { textAlign: 'center' }]}>No products in this routine yet.</Text> : null}
        <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.7)' }}><AffiliateNote center /></View>
        {!mine ? (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 10 }}>
            <Text style={T}>Want a routine like this, matched to you?</Text>
            <Btn label="Build my routine" onPress={() => router.push('/routine/welcome')} />
          </View>
        ) : null}
      </View>
    </Shell>
  );
}
