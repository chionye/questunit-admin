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

interface VerificationCallUser {
  id: number;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  UserProfile: {
    firstName: string | null;
    lastName: string | null;
    verificationDate: string | null;
    profilePhoto: string | null;
    verificationCallStatus: string | null;
  } | null;
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

export function VerificationCallsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<VerificationCallUser | null>(null);
  const [actionType, setActionType] = useState<'view' | 'complete' | 'cancel' | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['verification-calls', page],
    queryFn: () => verificationCallsApi.getAll({ page, limit: PAGE_SIZE }),
  });

  const calls: VerificationCallUser[] = response ? (extractData(response) as VerificationCallUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const completeMutation = useMutation({
    mutationFn: (userId: string) => verificationCallsApi.updateStatus(userId, 'completed'),
    onSuccess: () => {
      toast.success('Verification call marked as completed');
      queryClient.invalidateQueries({ queryKey: ['verification-calls'] });
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

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load verification calls</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No verification calls scheduled</p>
            <p className="text-gray-300 text-sm mt-1">Renderers who schedule a verification call will appear here</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email / Phone</TableHead>
                  <TableHead>Scheduled Date</TableHead>
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
                        {profile?.verificationDate
                          ? new Date(profile.verificationDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={(call as any).verificationCallStatus} />
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
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedUser) return;
                const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
                completeMutation.mutate(userId);
              }}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? 'Updating...' : 'Mark Completed'}
            </Button>
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
