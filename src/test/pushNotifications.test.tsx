import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const send = vi.fn();
vi.mock('@/api/endpoints', () => ({ pushNotificationsApi: { send: (...a: unknown[]) => send(...a) } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title }: { title: string }) => <h1>{title}</h1> }));

import { PushNotificationsPage } from '@/pages/PushNotifications';

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PushNotificationsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  send.mockReset().mockResolvedValue({
    data: { success: true, data: { audience: 'renderers', users: 40, withApp: 25, sent: 24, failed: 1 } },
  });
});

describe('Push Notifications page', () => {
  it("can't send without a title and message", () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Send notification' })).toBeDisabled();
  });

  it('asks for confirmation, then sends to the chosen audience', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('radio', { name: 'Renderers' }));
    await userEvent.type(screen.getByLabelText('Title'), 'Busy weekend');
    await userEvent.type(screen.getByLabelText('Message'), 'Go online for more requests');
    await userEvent.click(screen.getByRole('button', { name: 'Send notification' }));

    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText(/Send "Busy weekend" to/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, send' }));

    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({ audience: 'renderers', title: 'Busy weekend', body: 'Go online for more requests' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Sent to 24 of 25 devices');
  });
});
