/** @format */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { verificationCallsApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export interface VerificationCallUser {
  id: number;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  verificationCallStatus?: string | null;
  // The renderer's setup checklist (what onboarding asks for)
  setup?: { done: number; total: number; complete: boolean; missing: string[] } | null;
  UserProfile: {
    firstName: string | null;
    lastName: string | null;
    verificationDate: string | null;
    profilePhoto: string | null;
    verificationCallStatus: string | null;
  } | null;
  UserServices?: {
    id: number;
    serviceTypeId: number | null;
    requestedServiceTypeId: number | null;
    Service?: { name?: string } | null;
    ServiceType?: { id: number; name: string } | null;
    RequestedServiceType?: { id: number; name: string } | null;
  }[];
}

// Service type upgrades waiting on this call, e.g. "Car Washing: Basic → Deluxe".
function getUpgradeRequests(user: VerificationCallUser): string[] {
  return (user.UserServices ?? [])
    .filter((us) => us.requestedServiceTypeId && us.RequestedServiceType)
    .map((us) => {
      const service = us.Service?.name ? `${us.Service.name}: ` : '';
      const from = us.ServiceType?.name ?? 'None';
      return `${service}${from} → ${us.RequestedServiceType!.name}`;
    });
}

function TableSkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-36" />
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

function StatusBadge({ status }: { status?: string }) {
  const base = 'Verification Call';
  switch (status) {
    case 'completed':
      return <Badge variant="success">{base} Completed</Badge>;
    case 'cancelled':
      return <Badge variant="danger">{base} Cancelled</Badge>;
    case 'scheduled':
      return <Badge variant="warning">{base} Scheduled</Badge>;
    default:
      return <Badge variant="default">{base} Pending</Badge>;
  }
}

const PAGE_SIZE = 10;

type CallView = 'upcoming' | 'completed' | 'cancelled';
const VIEWS: { key: CallView; label: string; empty: string }[] = [
  { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming verification calls' },
  { key: 'completed', label: 'Completed', empty: 'No completed verification calls yet' },
  { key: 'cancelled', label: 'Cancelled', empty: 'No cancelled verification calls' },
];

// Shown in Lagos time whatever the admin's computer is set to.
export function formatCallTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

function SetupProgress({ setup }: { setup?: VerificationCallUser['setup'] }) {
  if (!setup) return <span className="text-gray-400">—</span>;
  return setup.complete ? (
    <Badge variant="success">Complete</Badge>
  ) : (
    <div>
      <Badge variant="warning">{setup.done} of {setup.total} done</Badge>
      <div className="text-xs text-gray-500 mt-1">Missing: {setup.missing.join(', ')}</div>
    </div>
  );
}

export function VerificationCallsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<CallView>('upcoming');
  const [selectedUser, setSelectedUser] = useState<VerificationCallUser | null>(null);
  const [actionType, setActionType] = useState<'view' | 'complete' | 'cancel' | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['verification-calls', view, page],
    queryFn: () => verificationCallsApi.getAll({ page, limit: PAGE_SIZE, view }),
  });

  const calls: VerificationCallUser[] = response ? (extractData(response) as VerificationCallUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const completeMutation = useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve: boolean }) =>
      verificationCallsApi.updateStatus(userId, 'completed', approve),
    onSuccess: (_res, { approve }) => {
      toast.success(approve ? 'Call completed and renderer approved' : 'Verification call marked as completed');
      queryClient.invalidateQueries({ queryKey: ['verification-calls'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRenderers'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update verification call status'),
  });

  const cancelMutation = useMutation({
    mutationFn: (userId: string) => verificationCallsApi.updateStatus(userId, 'cancelled'),
    onSuccess: () => {
      toast.success('Verification call cancelled');
      queryClient.invalidateQueries({ queryKey: ['verification-calls'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update verification call status'),
  });

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  return (
    <div>
      <Header
        title="Verification Calls"
        subtitle="Review and manage scheduled verification calls for renderers"
      />

      <div className="flex gap-1 mb-4" role="tablist">
        {VIEWS.map((v) => (
          <Button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            variant={view === v.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setView(v.key); setPage(1); }}>
            {v.label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load verification calls</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">{VIEWS.find((v) => v.key === view)?.empty}</p>
            <p className="text-gray-300 text-sm mt-1">Renderers who schedule a verification call will appear here</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Phone</TableHead>
                  <TableHead>Call Date &amp; Time</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const id = normalizeId(call as unknown as Record<string, unknown>);
                  const profile = call.UserProfile;
                  const name = profile?.firstName
                    ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
                    : '—';

                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-gray-600">
                        <div>{call.email || '—'}</div>
                        <div className="text-xs text-gray-400">{call.phone || '—'}</div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {formatCallTime(profile?.verificationDate)}
                        {view === 'upcoming' && profile?.verificationDate && new Date(profile.verificationDate) < new Date() && (
                          <div><Badge variant="danger">Overdue</Badge></div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getUpgradeRequests(call).length > 0 ? (
                          getUpgradeRequests(call).map((u) => (
                            <div key={u}>
                              <Badge variant="warning">Upgrade</Badge>{' '}
                              <span className="text-gray-600">{u}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">Onboarding</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <SetupProgress setup={call.setup} />
                      </TableCell>
                      <TableCell>
                        {call.status === 'pending' ? (
                          <Badge variant="warning">Awaiting approval</Badge>
                        ) : call.status === 'active' ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">{call.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={call.verificationCallStatus ?? undefined} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(call); setActionType('view'); }}>
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:text-green-600 hover:bg-green-50"
                            onClick={() => { setSelectedUser(call); setActionType('complete'); }}>
                            <CheckCircle size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedUser(call); setActionType('cancel'); }}>
                            <XCircle size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* View Dialog */}
      <Dialog open={actionType === 'view' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Verification Call Details</DialogTitle>
            <DialogDescription>Review the renderer's scheduled verification call</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              {selectedUser.UserProfile?.profilePhoto && (
                <div className="flex justify-center mb-2">
                  <img
                    src={selectedUser.UserProfile.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="First Name" value={selectedUser.UserProfile?.firstName} />
                <DetailRow label="Last Name" value={selectedUser.UserProfile?.lastName} />
                <DetailRow label="Email" value={selectedUser.email} />
                <DetailRow label="Phone" value={selectedUser.phone} />
                <DetailRow label="Scheduled Date" value={
                  selectedUser.UserProfile?.verificationDate
                    ? new Date(selectedUser.UserProfile.verificationDate).toLocaleString()
                    : null
                } />
                <DetailRow
                  label="Upgrade Request"
                  value={getUpgradeRequests(selectedUser).join(', ') || null}
                />
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setActionType('complete')}>
                  Mark Completed
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setActionType('cancel')}>
                  Cancel Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={actionType === 'complete' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Verification Call Completed</DialogTitle>
            <DialogDescription>
              Confirm that this verification call has been successfully completed.
              {selectedUser && getUpgradeRequests(selectedUser).length > 0 && (
                <> This will also apply the requested upgrade ({getUpgradeRequests(selectedUser).join(', ')}).</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.status === 'pending' && selectedUser.setup && !selectedUser.setup.complete && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-3">
              This renderer hasn't finished their setup yet (missing: {selectedUser.setup.missing.join(', ')}).
              If you approve now, they still can't go online until it's done.
            </p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              variant={selectedUser?.status === 'pending' ? 'outline' : 'default'}
              onClick={() => {
                if (!selectedUser) return;
                const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
                completeMutation.mutate({ userId, approve: false });
              }}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Updating...' : 'Mark Completed'}
            </Button>
            {selectedUser?.status === 'pending' && (
              <Button
                onClick={() => {
                  const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
                  completeMutation.mutate({ userId, approve: true });
                }}
                disabled={completeMutation.isPending}
              >
                Mark Completed &amp; Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={actionType === 'cancel' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Verification Call</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this verification call?
              {selectedUser && getUpgradeRequests(selectedUser).length > 0 && (
                <> The renderer's upgrade request will be dropped.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Close</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedUser) return;
                const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
                cancelMutation.mutate(userId);
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
