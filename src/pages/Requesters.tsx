/** @format */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { requestersApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { RequesterUser } from '@/types';

function TableSkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    pending: 'warning',
    suspended: 'destructive',
    rejected: 'destructive',
  };
  return <Badge variant={variants[status] ?? 'default'}>{status}</Badge>;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

const PAGE_SIZE = 10;

export function RequestersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<RequesterUser | null>(null);
  const [actionType, setActionType] = useState<'view' | 'activate' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['requesters', statusFilter, search, page],
    queryFn: () => requestersApi.getAll({
      status: statusFilter || undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
  });

  const requesters: RequesterUser[] = response ? (extractData(response) as RequesterUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const statusMutation = useMutation({
    mutationFn: ({ userId, status, reason: r }: { userId: string; status: string; reason?: string }) =>
      requestersApi.updateStatus(userId, status, r),
    onSuccess: (_, vars) => {
      toast.success(`Account ${vars.status === 'active' ? 'activated' : 'suspended'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['requesters'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update account status'),
  });

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
    setReason('');
  };

  const handleActivate = () => {
    if (!selectedUser) return;
    const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
    statusMutation.mutate({ userId, status: 'active' });
  };

  const handleSuspend = () => {
    if (!selectedUser) return;
    const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
    statusMutation.mutate({ userId, status: 'suspended', reason });
  };

  const nin = selectedUser?.Documents?.find((d) => d.type === 'nin');

  return (
    <div>
      <Header title="Requesters" subtitle="Manage requester accounts and verify identity" />

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load requesters</p>
          </div>
        ) : requesters.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No requesters found</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>NIN</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requesters.map((requester) => {
                const id = normalizeId(requester as unknown as Record<string, unknown>);
                const profile = requester.UserProfile;
                const name = profile?.firstName
                  ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
                  : '—';
                const ninDoc = requester.Documents?.find((d) => d.type === 'nin');

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-gray-600">
                      <div>{requester.email || '—'}</div>
                      <div className="text-xs text-gray-400">{requester.phone || '—'}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {ninDoc?.documentNumber
                        ? <span className="font-mono text-xs">{ninDoc.documentNumber}</span>
                        : <span className="text-gray-300 text-xs">Not provided</span>
                      }
                    </TableCell>
                    <TableCell>
                      {profile?.profilePhoto ? (
                        <img
                          src={profile.profilePhoto}
                          alt="profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-300 text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={requester.status} />
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {requester.createdAt ? new Date(requester.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(requester); setActionType('view'); }}>
                          <Eye size={16} />
                        </Button>
                        {requester.status !== 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:text-green-600 hover:bg-green-50"
                            onClick={() => { setSelectedUser(requester); setActionType('activate'); }}
                          >
                            <CheckCircle size={16} />
                          </Button>
                        )}
                        {requester.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedUser(requester); setActionType('suspend'); }}
                          >
                            <XCircle size={16} />
                          </Button>
                        )}
                      </div>
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

      {/* View Dialog */}
      <Dialog open={actionType === 'view' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle>Requester Details</DialogTitle>
            <DialogDescription>Identity and account information</DialogDescription>
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
                <DetailRow
                  label="First Name"
                  value={selectedUser.UserProfile?.firstName}
                />
                <DetailRow
                  label="Last Name"
                  value={selectedUser.UserProfile?.lastName}
                />
                <DetailRow label="Email" value={selectedUser.email} />
                <DetailRow label="Phone" value={selectedUser.phone} />
                <DetailRow label="Date of Birth" value={selectedUser.UserProfile?.dob} />
                <DetailRow label="Gender" value={selectedUser.UserProfile?.gender} />
                <DetailRow label="City" value={selectedUser.UserProfile?.city} />
                <DetailRow label="Status" value={selectedUser.status} />
              </div>
              <Separator />
              <div>
                <span className="text-sm font-medium text-gray-500">NIN</span>
                <p className="text-sm font-mono mt-0.5">
                  {nin?.documentNumber ?? <span className="text-gray-400 not-italic">Not provided</span>}
                </p>
                {nin && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Status: {nin.status} · Submitted {new Date(nin.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex gap-3">
                {selectedUser.status !== 'active' && (
                  <Button className="flex-1" onClick={() => setActionType('activate')}>
                    Activate Account
                  </Button>
                )}
                {selectedUser.status === 'active' && (
                  <Button variant="destructive" className="flex-1" onClick={() => setActionType('suspend')}>
                    Suspend Account
                  </Button>
                )}
                <Button variant="secondary" onClick={closeModal}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={actionType === 'activate' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Account</DialogTitle>
            <DialogDescription>
              This will allow the requester to start making service requests.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleActivate} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? 'Activating...' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={actionType === 'suspend' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>The requester will no longer be able to make requests.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Reason for suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? 'Suspending...' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
