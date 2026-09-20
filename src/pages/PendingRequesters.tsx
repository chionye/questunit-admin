/** @format */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, Search } from 'lucide-react';
import { requestersApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

function VerificationLevelBadge({ onboardingStep, isOnboardingComplete }: { onboardingStep?: string | null; isOnboardingComplete?: boolean }) {
  if (isOnboardingComplete) return <Badge variant="success">Completed</Badge>;
  if (!onboardingStep) return <Badge variant="secondary">Not started</Badge>;
  const page1Steps = ['phone_verification', 'email_verification', 'profile_setup'];
  const page2Steps = ['service_selection', 'document_upload', 'tool_upload', 'verification_call'];
  if (page1Steps.includes(onboardingStep)) return <Badge variant="warning">Page 1</Badge>;
  if (page2Steps.includes(onboardingStep)) return <Badge variant="default">Page 2</Badge>;
  return <Badge variant="secondary">{onboardingStep}</Badge>;
}

const PAGE_SIZE = 10;

export function PendingRequestersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [selectedUser, setSelectedUser] = useState<RequesterUser | null>(null);
  const [actionType, setActionType] = useState<'view' | 'activate' | null>(null);

  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['pending-requesters', search, page],
    queryFn: () => requestersApi.getAll({
      status: 'pending',
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  const requesters: RequesterUser[] = response ? (extractData(response) as RequesterUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const approveMutation = useMutation({
    mutationFn: (userId: string) => requestersApi.updateStatus(userId, 'active'),
    onSuccess: () => {
      toast.success('Account approved — requester is now active');
      queryClient.invalidateQueries({ queryKey: ['pending-requesters'] });
      queryClient.invalidateQueries({ queryKey: ['requesters'] });
      closeModal();
    },
    onError: () => toast.error('Failed to approve account'),
  });

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  const handleApprove = () => {
    if (!selectedUser) return;
    const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
    approveMutation.mutate(userId);
  };

  const nin = selectedUser?.Documents?.find((d) => d.type === 'nin');

  return (
    <div>
      <Header
        title="Pending Requesters"
        subtitle="Review and approve requester accounts awaiting verification"
      />

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
          {isFetching && searchInput !== search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm text-amber-700 font-medium">
            {totalCount} pending {totalCount === 1 ? 'account' : 'accounts'}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load pending requesters</p>
          </div>
        ) : requesters.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">{search ? 'No pending requesters match your search' : 'No pending requesters'}</p>
            <p className="text-gray-300 text-sm mt-1">{search ? 'Try a different name, email or phone' : 'All requester accounts have been reviewed'}</p>
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
                  <TableHead>Verification</TableHead>
                  <TableHead>Submitted</TableHead>
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
                        <VerificationLevelBadge
                          onboardingStep={requester.onboardingStep}
                          isOnboardingComplete={requester.isOnboardingComplete}
                        />
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {requester.createdAt ? new Date(requester.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(requester); setActionType('view'); }}>
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:text-green-600 hover:bg-green-50"
                            onClick={() => { setSelectedUser(requester); setActionType('activate'); }}>
                            <CheckCircle size={16} />
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
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle>Pending Requester Details</DialogTitle>
            <DialogDescription>Review identity and account information before approving</DialogDescription>
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
                <DetailRow label="Date of Birth" value={selectedUser.UserProfile?.dob} />
                <DetailRow label="Gender" value={selectedUser.UserProfile?.gender} />
                <DetailRow label="City" value={selectedUser.UserProfile?.city} />
                <DetailRow label="Status" value={selectedUser.status} />
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Service Activity</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.completed ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Completed</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.cancelled ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Cancelled</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.pending ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Pending</div>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm font-medium text-gray-500">NIN</span>
                <p className="text-sm font-mono mt-0.5">
                  {nin?.documentNumber ?? <span className="text-gray-400 not-italic">Not provided</span>}
                </p>
                {nin && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(nin.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setActionType('activate')}>
                  Approve Account
                </Button>
                <Button variant="secondary" onClick={closeModal}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={actionType === 'activate' && !!selectedUser} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Account</DialogTitle>
            <DialogDescription>
              This will activate the requester's account and allow them to start making service requests.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
