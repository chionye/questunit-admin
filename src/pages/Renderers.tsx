import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Eye, Search } from 'lucide-react';
import { renderersApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { useDebounce } from '@/hooks/useDebounce';
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
import type { Renderer, ApproveRendererRequest, RejectRendererRequest } from '@/types';

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

const PAGE_SIZE = 10;

export function RenderersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [selectedRenderer, setSelectedRenderer] = useState<Renderer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active'>('pending');

  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [serviceRejectingId, setServiceRejectingId] = useState<number | null>(null);
  const [serviceRejectReason, setServiceRejectReason] = useState('');

  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['pendingRenderers', page, search, statusFilter],
    queryFn: () => renderersApi.getPending({ page, limit: PAGE_SIZE, search: search || undefined, status: statusFilter }),
    placeholderData: (prev) => prev,
  });

  const renderers: Renderer[] = response ? (extractData(response) as Renderer[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const approveMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ApproveRendererRequest }) =>
      renderersApi.approve(userId, data),
    onSuccess: () => {
      toast.success('Renderer approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pendingRenderers'] });
      setPage(1);
      closeModal();
    },
    onError: () => toast.error('Failed to approve renderer'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: RejectRendererRequest }) =>
      renderersApi.reject(userId, data),
    onSuccess: () => {
      toast.success('Renderer rejected');
      queryClient.invalidateQueries({ queryKey: ['pendingRenderers'] });
      closeModal();
    },
    onError: () => toast.error('Failed to reject renderer'),
  });

  const userServiceMutation = useMutation({
    mutationFn: ({ userServiceId, data }: { userServiceId: number; data: { approvalStatus: 'approved' | 'rejected'; reason?: string } }) =>
      renderersApi.updateUserServiceStatus(userServiceId, data),
    onSuccess: (_data, variables) => {
      toast.success(variables.data.approvalStatus === 'approved' ? 'Service approved' : 'Service rejected');
      queryClient.invalidateQueries({ queryKey: ['pendingRenderers'] });
      setServiceRejectingId(null);
      setServiceRejectReason('');
    },
    onError: () => toast.error('Failed to update service status'),
  });

  const handleApproveService = (userServiceId: number) => {
    userServiceMutation.mutate({ userServiceId, data: { approvalStatus: 'approved' } });
  };

  const handleRejectService = (userServiceId: number) => {
    if (!serviceRejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    userServiceMutation.mutate({ userServiceId, data: { approvalStatus: 'rejected', reason: serviceRejectReason } });
  };

  const closeModal = () => {
    setSelectedRenderer(null);
    setActionType(null);
    setNotes('');
    setHourlyRate('');
    setRejectReason('');
    setRejectNotes('');
  };

  const handleApprove = () => {
    if (!selectedRenderer) return;
    const userId = normalizeId(selectedRenderer as unknown as Record<string, unknown>);
    approveMutation.mutate({
      userId,
      data: {
        notes: notes || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      },
    });
  };

  const handleReject = () => {
    if (!selectedRenderer || !rejectReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    const userId = normalizeId(selectedRenderer as unknown as Record<string, unknown>);
    rejectMutation.mutate({
      userId,
      data: { reason: rejectReason, notes: rejectNotes || undefined },
    });
  };

  return (
    <div>
      <Header title="Renderers" subtitle="Review renderer applications and manage service approvals" />

      {/* Search + Status filter */}
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
        <div className="flex items-center gap-1 rounded-lg border bg-white p-0.5">
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setStatusFilter('active'); setPage(1); }}
          >
            Active
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load pending renderers</p>
          </div>
        ) : renderers.length === 0 ? (
          <div className="p-12 text-center">
<p className="text-gray-400 text-lg">{search ? 'No renderers match your search' : statusFilter === 'pending' ? 'No pending renderers' : 'No active renderers'}</p>
          <p className="text-gray-300 text-sm mt-1">{search ? 'Try a different name, email or phone' : statusFilter === 'pending' ? 'All applications have been reviewed' : 'All actives have been processed'}</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderers.map((renderer) => {
                const id = normalizeId(renderer as unknown as Record<string, unknown>);
                const profile = renderer.UserProfile;
                const name = profile?.firstName
                  ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
                  : '—';
                const email = renderer.email || '—';
                const phone = renderer.phone || '—';
                const userServices = renderer.UserServices ?? [];
                const serviceList = Array.from(
                  new Set(userServices.map((us) => us.Service?.name).filter(Boolean))
                ) as string[];
                const serviceTypeList = Array.from(
                  new Set(userServices.map((us) => us.ServiceType?.name || us.description).filter(Boolean))
                ) as string[];

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
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
                    <TableCell className="text-gray-600">{email}</TableCell>
                    <TableCell className="text-gray-600">{phone}</TableCell>
                    <TableCell className="text-gray-600">
                      {serviceList.length > 0 ? serviceList.join(', ') : '—'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {serviceTypeList.length > 0 ? serviceTypeList.join(', ') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{renderer.status || 'pending'}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {renderer.createdAt ? new Date(renderer.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedRenderer(renderer); setActionType('view'); }}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => { setSelectedRenderer(renderer); setActionType('approve'); }}>
                          <Check size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setSelectedRenderer(renderer); setActionType('reject'); }}>
                          <X size={16} />
                        </Button>
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
      <Dialog open={actionType === 'view' && !!selectedRenderer} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Renderer Details</DialogTitle>
            <DialogDescription>Review the renderer's application details</DialogDescription>
          </DialogHeader>
          {selectedRenderer && (
            <div className="space-y-4">
              {selectedRenderer.UserProfile?.profilePhoto && (
                <div className="flex justify-center mb-2">
                  <img
                    src={selectedRenderer.UserProfile.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="Name" value={selectedRenderer.UserProfile?.firstName
                  ? `${selectedRenderer.UserProfile.firstName} ${selectedRenderer.UserProfile.lastName ?? ''}`.trim()
                  : null} />
                <DetailRow label="Email" value={selectedRenderer.email} />
                <DetailRow label="Phone" value={selectedRenderer.phone} />
                <DetailRow label="Status" value={selectedRenderer.status} />
                <DetailRow label="Experience" value={selectedRenderer.UserProfile?.experience} />
                <DetailRow label="Hourly Rate ($)" value={selectedRenderer.UserProfile?.hourlyRate != null ? String(selectedRenderer.UserProfile.hourlyRate) : null} />
              </div>
              {(selectedRenderer.UserServices?.length ?? 0) > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Services Offered</h4>
                    <div className="space-y-2">
                      {selectedRenderer.UserServices!.map((us, index) => (
                        <div key={us.id ?? index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default" className="text-xs">{us.Service?.name || 'Unknown service'}</Badge>
                            {(us.ServiceType?.name || us.description) && (
                              <Badge variant="secondary" className="text-xs">{us.ServiceType?.name || us.description}</Badge>
                            )}
                            <Badge variant={us.approvalStatus === 'approved' ? 'default' : us.approvalStatus === 'rejected' ? 'danger' : 'secondary'} className="text-xs">
                              {us.approvalStatus || 'pending'}
                            </Badge>
                            {us.approvalStatus !== 'approved' && (
                              <div className="ml-auto flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300"
                                  disabled={userServiceMutation.isPending}
                                  onClick={() => handleApproveService(us.id)}
                                >
                                  <Check size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300"
                                  disabled={userServiceMutation.isPending}
                                  onClick={() => setServiceRejectingId(serviceRejectingId === us.id ? null : us.id)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                          {(us.ServiceType?.name || us.description) && (
                            <div className="text-sm">
                              <span className="text-gray-500">Service Type:</span> {us.ServiceType?.name || us.description}
                            </div>
                          )}
                          {us.rejectionReason && (
                            <div className="text-xs text-red-500 mt-1">Rejection reason: {us.rejectionReason}</div>
                          )}
                          {serviceRejectingId === us.id && (
                            <div className="mt-2 flex gap-2">
                              <Input
                                placeholder="Rejection reason"
                                value={serviceRejectReason}
                                onChange={(e) => setServiceRejectReason(e.target.value)}
                              />
                              <Button size="sm" variant="destructive" disabled={userServiceMutation.isPending} onClick={() => handleRejectService(us.id)}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Service Activity</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRenderer.serviceCounts?.completed ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Completed</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRenderer.serviceCounts?.cancelled ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Cancelled</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedRenderer.serviceCounts?.pending ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Pending</div>
                  </div>
                </div>
              </div>
              {selectedRenderer.UserProfile?.skills && selectedRenderer.UserProfile.skills.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Skills</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRenderer.UserProfile.skills.map((skill, i) => (
                      <Badge key={i} variant="default">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRenderer.Documents && selectedRenderer.Documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {selectedRenderer.Documents.map((doc, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={doc.type === 'nin' ? 'default' : 'secondary'} className="text-xs">
                              {doc.type === 'nin' ? 'NIN' : doc.type === 'guarantor' ? 'Guarantor' : doc.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'danger' : 'secondary'} className="text-xs">
                              {doc.status}
                            </Badge>
                          </div>
                          {doc.type === 'guarantor' ? (
                            <div className="text-sm space-y-0.5">
                              <div><span className="text-gray-500">Name:</span> {doc.notes}</div>
                              <div><span className="text-gray-500">Phone:</span> <span className="font-mono">{doc.url}</span></div>
                              <div><span className="text-gray-500">NIN:</span> <span className="font-mono">{doc.documentNumber}</span></div>
                            </div>
                          ) : (
                            <div className="text-sm space-y-0.5">
                              {doc.documentNumber && <div><span className="text-gray-500">Number:</span> <span className="font-mono">{doc.documentNumber}</span></div>}
                              {doc.url && <div><span className="text-gray-500">File:</span> <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a></div>}
                              {doc.notes && <div><span className="text-gray-500">Notes:</span> {doc.notes}</div>}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Separator className="my-4" />
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setActionType('approve')}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={() => setActionType('reject')}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={actionType === 'approve' && !!selectedRenderer} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Renderer</DialogTitle>
            <DialogDescription>Set rate and add approval notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input type="number" placeholder="30.00" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Approval notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === 'reject' && !!selectedRenderer} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Renderer</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
