"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseUser } from '@/lib/useSupabaseUser';
import Auth from '@/components/Auth';

export default function Page() {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    if (user) {
      const back = params.get('redirectedFrom') || '/home';
      router.replace(back);
    }
  }, [user, router, params]);
  return <Auth />;
}
