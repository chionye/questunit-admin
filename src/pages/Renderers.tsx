import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Eye } from 'lucide-react';
import { renderersApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
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

export function RenderersPage() {
  const queryClient = useQueryClient();
  const [selectedRenderer, setSelectedRenderer] = useState<Renderer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view' | null>(null);

  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['pendingRenderers'],
    queryFn: renderersApi.getPending,
  });

  const renderers: Renderer[] = response ? (extractData(response) as Renderer[] ?? []) : [];

  const approveMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ApproveRendererRequest }) =>
      renderersApi.approve(userId, data),
    onSuccess: () => {
      toast.success('Renderer approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pendingRenderers'] });
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
      <Header title="Pending Renderers" subtitle="Review and approve renderer applications" />

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load pending renderers</p>
          </div>
        ) : renderers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No pending renderers</p>
            <p className="text-gray-300 text-sm mt-1">All applications have been reviewed</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderers.map((renderer) => {
                const id = normalizeId(renderer as unknown as Record<string, unknown>);
                const name = renderer.name || renderer.user?.name || '—';
                const email = renderer.email || renderer.user?.email || '—';
                const phone = renderer.phone || renderer.user?.phone || '—';

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-gray-600">{email}</TableCell>
                    <TableCell className="text-gray-600">{phone}</TableCell>
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
        )}
      </Card>

      {/* View Dialog */}
      <Dialog open={actionType === 'view' && !!selectedRenderer} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Renderer Details</DialogTitle>
            <DialogDescription>Review the renderer's application details</DialogDescription>
          </DialogHeader>
          {selectedRenderer && (
            <div className="space-y-3">
              <DetailRow label="Name" value={selectedRenderer.name || selectedRenderer.user?.name} />
              <DetailRow label="Email" value={selectedRenderer.email || selectedRenderer.user?.email} />
              <DetailRow label="Phone" value={selectedRenderer.phone || selectedRenderer.user?.phone} />
              <DetailRow label="Status" value={selectedRenderer.status} />
              <DetailRow label="Experience" value={selectedRenderer.experience} />
              {selectedRenderer.skills && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Skills</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRenderer.skills.map((skill, i) => (
                      <Badge key={i} variant="default">{skill}</Badge>
                    ))}
                  </div>
                </div>
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
