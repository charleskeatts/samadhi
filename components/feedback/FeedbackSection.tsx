/**
 * Client wrapper for the feedback form
 * Calls router.refresh() after a successful submission so the server-rendered
 * table picks up the new row without a full page reload.
 */

'use client';

import { useRouter } from 'next/navigation';
import FeedbackForm from './FeedbackForm';

export default function FeedbackSection() {
  const router = useRouter();
  return <FeedbackForm onSuccess={() => router.refresh()} />;
}
