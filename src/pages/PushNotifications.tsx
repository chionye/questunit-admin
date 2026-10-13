/** @format */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pushNotificationsApi, type PushAudience, type PushResult } from '@/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AUDIENCES: { key: PushAudience; label: string; hint: string }[] = [
  { key: 'all', label: 'Everyone', hint: 'Request app and Render app users' },
  { key: 'requesters', label: 'Requesters', hint: 'Request app users only' },
  { key: 'renderers', label: 'Renderers', hint: 'Render app users only' },
];
const TITLE_MAX = 65;
const BODY_MAX = 240;

// Send a push notification to the apps. Reaches people whose app has
// registered for notifications; everyone in the audience also gets it in-app.
export function PushNotificationsPage() {
  const [audience, setAudience] = useState<PushAudience>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);

  const sendMutation = useMutation({
    mutationFn: () => pushNotificationsApi.send({ audience, title: title.trim(), body: body.trim() }),
    onSuccess: (res) => {
      const data = res.data?.data as PushResult;
      setResult(data);
      setConfirming(false);
      setTitle('');
      setBody('');
      toast.success(`Sent to ${data?.sent ?? 0} device${data?.sent === 1 ? '' : 's'}`);
    },
    onError: (err: any) => {
      setConfirming(false);
      toast.error(err?.response?.data?.message || 'Failed to send notification');
    },
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;
  const audienceLabel = AUDIENCES.find((a) => a.key === audience)?.label;

  return (
    <div>
      <Header title="Push Notifications" subtitle="Send a notification to the Request and Render apps" />

      <Card className="p-6 space-y-5 max-w-2xl">
        <div className="space-y-2">
          <Label>Send to</Label>
          <div className="flex gap-2" role="radiogroup">
            {AUDIENCES.map((a) => (
              <Button
                key={a.key}
                role="radio"
                aria-checked={audience === a.key}
                variant={audience === a.key ? 'default' : 'outline'}
                onClick={() => setAudience(a.key)}>
                {a.label}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{AUDIENCES.find((a) => a.key === audience)?.hint}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="push-title">Title</Label>
          <Input
            id="push-title"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New services available"
          />
          <p className="text-xs text-gray-400 text-right">{title.length}/{TITLE_MAX}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="push-body">Message</Label>
          <Textarea
            id="push-body"
            value={body}
            maxLength={BODY_MAX}
            rows={4}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you want to tell them?"
          />
          <p className="text-xs text-gray-400 text-right">{body.length}/{BODY_MAX}</p>
        </div>

        {confirming ? (
          <div className="rounded-md bg-amber-50 p-4 space-y-3">
            <p className="text-sm text-amber-800">
              Send "{title.trim()}" to <strong>{audienceLabel}</strong>? This can't be undone.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                {sendMutation.isPending ? 'Sending...' : 'Yes, send'}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={sendMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setConfirming(true)} disabled={!canSend}>
            Send notification
          </Button>
        )}

        {result && (
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700" role="status">
            Sent to <strong>{result.sent}</strong> of {result.withApp} devices with notifications on
            ({result.users} {result.users === 1 ? 'person' : 'people'} in the audience).
            {result.failed > 0 && <> {result.failed} couldn't be delivered.</>}
            {result.withApp < result.users && (
              <> The rest haven't allowed notifications in the latest app yet; they'll see it in the app.</>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
