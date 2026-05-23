import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { onLeadSubmitted } from '@/inngest/lead-submitted';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onLeadSubmitted],
});
