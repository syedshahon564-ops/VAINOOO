'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MyHistoryComponent from '@/components/MyHistoryComponent';

export default function HistoryPage() {
  const router = useRouter();

  return (
    <MyHistoryComponent onBack={() => router.back()} />
  );
}
