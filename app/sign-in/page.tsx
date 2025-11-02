"use client";
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseUser } from '@/lib/useSupabaseUser';
import Auth from '@/components/Auth';

function SignInContent() {
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

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
