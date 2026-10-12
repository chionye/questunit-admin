import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getAll = vi.fn();
const updateStatus = vi.fn();
vi.mock('@/api/endpoints', () => ({
  verificationCallsApi: {
    getAll: (...a: unknown[]) => getAll(...a),
    updateStatus: (...a: unknown[]) => updateStatus(...a),
  },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ title }: { title: string }) => <h1>{title}</h1> }));

import { VerificationCallsPage, formatCallTime } from '@/pages/VerificationCalls';

// Rows shaped like the real backend response (checked against MariaDB).
const pendingRenderer = {
  id: 987,
  email: 'b@example.com',
  phone: '+2348000000987',
  role: 'renderer',
  status: 'pending',
  createdAt: '2026-09-01T10:00:00.000Z',
  verificationCallStatus: 'pending',
  UserProfile: { firstName: 'Bola', lastName: 'Ade', verificationDate: '2026-10-12T08:00:00.000Z', profilePhoto: null },
  UserServices: [],
  setup: { done: 4, total: 8, complete: false, missing: ['Add your guarantor', 'Upload your tools'] },
};
const activeRenderer = {
  ...pendingRenderer,
  id: 25,
  status: 'active',
  UserProfile: { ...pendingRenderer.UserProfile, firstName: 'Zainab', lastName: 'Yusuf', verificationDate: '2026-10-12T09:30:00.000Z' },
  setup: { done: 8, total: 8, complete: true, missing: [] },
};
const page = (rows: unknown[]) => ({ data: { success: true, data: { data: rows, totalCount: rows.length, totalPages: 1, currentPage: 1 } } });

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <VerificationCallsPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  getAll.mockReset().mockResolvedValue(page([pendingRenderer, activeRenderer]));
  updateStatus.mockReset().mockResolvedValue({ data: { success: true, data: { approved: true } } });
});

describe('Verification Calls page', () => {
  it('lists upcoming calls with the date and time in Lagos time', async () => {
    renderPage();

    expect(await screen.findByText('Bola Ade')).toBeInTheDocument();
    expect(getAll).toHaveBeenCalledWith({ page: 1, limit: 10, view: 'upcoming' });
    // 08:00 UTC is 9:00 am in Lagos
    expect(screen.getByText(formatCallTime('2026-10-12T08:00:00.000Z'))).toBeInTheDocument();
    expect(formatCallTime('2026-10-12T08:00:00.000Z')).toMatch(/9:00/);
  });

  it("shows each renderer's setup progress and account status", async () => {
    renderPage();
    await screen.findByText('Bola Ade');

    expect(screen.getByText('4 of 8 done')).toBeInTheDocument();
    expect(screen.getByText(/Missing: Add your guarantor, Upload your tools/)).toBeInTheDocument();
    expect(screen.getByText('Awaiting approval')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('switches between Upcoming, Completed and Cancelled', async () => {
    renderPage();
    await screen.findByText('Bola Ade');

    await userEvent.click(screen.getByRole('tab', { name: 'Completed' }));
    await waitFor(() => expect(getAll).toHaveBeenLastCalledWith({ page: 1, limit: 10, view: 'completed' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Cancelled' }));
    await waitFor(() => expect(getAll).toHaveBeenLastCalledWith({ page: 1, limit: 10, view: 'cancelled' }));
  });

  it('can complete the call and approve a pending renderer in one step', async () => {
    renderPage();
    const row = (await screen.findByText('Bola Ade')).closest('tr')!;
    const buttons = within(row).getAllByRole('button');
    await userEvent.click(buttons[1]); // the green tick: mark completed

    expect(screen.getByText(/hasn't finished their setup yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark Completed & Approve' }));

    await waitFor(() => expect(updateStatus).toHaveBeenCalledWith('987', 'completed', true));
  });

  it('only offers to approve renderers who are awaiting approval', async () => {
    renderPage();
    const row = (await screen.findByText('Zainab Yusuf')).closest('tr')!;
    await userEvent.click(within(row).getAllByRole('button')[1]);

    expect(screen.queryByRole('button', { name: 'Mark Completed & Approve' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));
    await waitFor(() => expect(updateStatus).toHaveBeenCalledWith('25', 'completed', false));
  });
});
