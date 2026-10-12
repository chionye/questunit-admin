/** @format */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search } from 'lucide-react';
import { requestsApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { RequestActivity, RequestActivityUser, RequestStatusCounts } from '@/types';

function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

// Status groups the backend accepts as a filter, with an exact status as the
// alternative.
const STATUS_GROUPS: { key: keyof RequestStatusCounts; label: string; tone: string }[] = [
  { key: 'all', label: 'All requests', tone: 'text-gray-900' },
  { key: 'ongoing', label: 'Ongoing', tone: 'text-blue-600' },
  { key: 'completed', label: 'Completed', tone: 'text-green-600' },
  { key: 'cancelled', label: 'Cancelled', tone: 'text-red-600' },
  { key: 'expired', label: 'Expired', tone: 'text-gray-500' },
];

function statusGroupLabel(status: string) {
  if (['searching', 'pending', 'matched', 'accepted', 'in_progress'].includes(status)) return 'Ongoing';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled' || status === 'rejected') return 'Cancelled';
  if (status === 'expired') return 'Expired';
  return '';
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    completed: 'success',
    in_progress: 'info',
    accepted: 'info',
    matched: 'info',
    searching: 'warning',
    pending: 'warning',
    cancelled: 'danger',
    rejected: 'danger',
    expired: 'secondary',
  };
  return <Badge variant={variants[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>;
}

function userName(user: RequestActivityUser | null) {
  const profile = user?.UserProfile;
  if (profile?.firstName) return `${profile.firstName} ${profile.lastName ?? ''}`.trim();
  return user?.email || user?.phone || '—';
}

function formatAmount(request: RequestActivity) {
  const value = Number(request.finalPrice ?? request.amount);
  if (Number.isNaN(value)) return '—';
  return `${request.currency || 'NGN'} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const PAGE_SIZE = 10;

export function RequestActivitiesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<RequestActivity | null>(null);

  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin-requests', statusFilter, search, page],
    queryFn: () => requestsApi.getAll({
      status: statusFilter || undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  const requests: RequestActivity[] = response ? (extractData(response) as RequestActivity[] ?? []) : [];
  const statusCounts = (response?.data?.data as unknown as { statusCounts?: RequestStatusCounts } | undefined)?.statusCounts;
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  return (
    <div>
      <Header title="Requests" subtitle="Every service request from the request app and where it stands" />

      {/* Status summary: click a card to filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {STATUS_GROUPS.map((group) => {
          const active = (statusFilter || 'all') === group.key;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => { setStatusFilter(group.key === 'all' ? '' : group.key); setPage(1); }}
              className={`text-left rounded-xl border bg-white px-4 py-3 transition-colors cursor-pointer ${
                active ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-xs font-medium text-gray-500">{group.label}</div>
              <div className={`text-2xl font-bold mt-1 ${group.tone}`}>
                {statusCounts ? statusCounts[group.key].toLocaleString() : '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, location, service or ID..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
          {isFetching && searchInput !== search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}
        </div>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <optgroup label="Groups">
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled or rejected</option>
            <option value="expired">Expired</option>
          </optgroup>
          <optgroup label="Exact status">
          <option value="searching">Searching</option>
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
          </optgroup>
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load requests</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">{search || statusFilter ? 'No requests match your filters' : 'No requests yet'}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Renderer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const id = normalizeId(request as unknown as Record<string, unknown>);
                  return (
                    <TableRow key={id}>
                      <TableCell className="text-gray-400 text-sm">#{request.id}</TableCell>
                      <TableCell className="font-medium">
                        <div>{userName(request.requester)}</div>
                        <div className="text-xs text-gray-400">{request.requester?.phone || ''}</div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {request.renderer ? userName(request.renderer) : <span className="text-gray-300">Not assigned</span>}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm max-w-[240px]">
                        <div className="truncate" title={request.addressText || request.address}>
                          {request.addressText || request.address || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{request.Service?.name || '—'}</TableCell>
                      <TableCell className="text-gray-600">{request.serviceType?.name || '—'}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatAmount(request)}</TableCell>
                      <TableCell className="text-gray-500 text-sm whitespace-nowrap">{formatDateTime(request.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                        <div className="text-[11px] text-gray-400 mt-1">{statusGroupLabel(request.status)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelected(request)}>
                          <Eye size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Request details */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request #{selected?.id}</DialogTitle>
            <DialogDescription>Full details of this service request</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Requester" value={userName(selected.requester)} />
                <DetailRow label="Requester phone" value={selected.requester?.phone} />
                <DetailRow label="Renderer" value={selected.renderer ? userName(selected.renderer) : 'Not assigned'} />
                <DetailRow label="Status" value={selected.status.replace(/_/g, ' ')} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Service" value={selected.Service?.name} />
                <DetailRow label="Service type" value={selected.serviceType?.name} />
                <DetailRow label="Amount" value={formatAmount(selected)} />
                <DetailRow label="Payment status" value={selected.paymentStatus} />
                <DetailRow label="Requested at" value={formatDateTime(selected.createdAt)} />
                <DetailRow label="Scheduled for" value={formatDateTime(selected.scheduledAt)} />
              </div>
              <Separator />
              <DetailRow label="Location" value={selected.addressText || selected.address} />
              {selected.specialInstructions && (
                <DetailRow label="Notes from requester" value={selected.specialInstructions} />
              )}
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress</h4>
                <ol className="space-y-2">
                  {[
                    { label: 'Requested', at: selected.createdAt },
                    { label: 'Matched with a renderer', at: selected.matchedAt },
                    { label: 'Accepted by renderer', at: selected.acceptedAt },
                    { label: 'Started', at: selected.startedAt },
                    { label: 'Completed', at: selected.completedAt },
                  ].map((step) => (
                    <li key={step.label} className="flex items-center gap-3 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${step.at ? 'bg-green-500' : 'bg-gray-200'}`} />
                      <span className={step.at ? 'text-gray-900' : 'text-gray-400'}>{step.label}</span>
                      <span className="ml-auto text-gray-500">{step.at ? formatDateTime(step.at) : '—'}</span>
                    </li>
                  ))}
                  {(selected.status === 'cancelled' || selected.status === 'rejected' || selected.status === 'expired') && (
                    <li className="flex items-center gap-3 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-gray-900 capitalize">
                        {selected.status}{selected.cancelledBy ? ` by ${selected.cancelledBy}` : ''}
                      </span>
                      <span className="ml-auto text-gray-500">{formatDateTime(selected.updatedAt)}</span>
                    </li>
                  )}
                </ol>
              </div>
              {selected.cancellationReason && (
                <DetailRow label="Cancellation reason" value={selected.cancellationReason} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
