import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Eye } from 'lucide-react';
import { renderersApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/common/Modal';
import { TableSkeleton } from '@/components/common/Skeleton';
import type { Renderer, ApproveRendererRequest, RejectRendererRequest } from '@/types';

export function RenderersPage() {
  const queryClient = useQueryClient();
  const [selectedRenderer, setSelectedRenderer] = useState<Renderer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'view' | null>(null);

  // Approve form state
  const [notes, setNotes] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  // Reject form state
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
      data: {
        reason: rejectReason,
        notes: rejectNotes || undefined,
      },
    });
  };

  return (
    <div>
      <Header title="Pending Renderers" subtitle="Review and approve renderer applications" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {renderers.map((renderer) => {
                  const id = normalizeId(renderer as unknown as Record<string, unknown>);
                  const name = renderer.name || renderer.user?.name || '—';
                  const email = renderer.email || renderer.user?.email || '—';
                  const phone = renderer.phone || renderer.user?.phone || '—';

                  return (
                    <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          {renderer.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {renderer.createdAt ? new Date(renderer.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                            title="View Details"
                            onClick={() => { setSelectedRenderer(renderer); setActionType('view'); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                            title="Approve"
                            onClick={() => { setSelectedRenderer(renderer); setActionType('approve'); }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Reject"
                            onClick={() => { setSelectedRenderer(renderer); setActionType('reject'); }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={actionType === 'view' && !!selectedRenderer}
        onClose={closeModal}
        title="Renderer Details"
        maxWidth="550px"
      >
        {selectedRenderer && (
          <div className="space-y-4">
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
                    <span key={i} className="px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
                onClick={() => setActionType('approve')}
              >
                Approve
              </button>
              <button
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
                onClick={() => setActionType('reject')}
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={actionType === 'approve' && !!selectedRenderer}
        onClose={closeModal}
        title="Approve Renderer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate ($)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="30.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              rows={3}
              placeholder="Approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={actionType === 'reject' && !!selectedRenderer}
        onClose={closeModal}
        title="Reject Renderer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason *</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none"
              rows={3}
              placeholder="Additional notes..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 cursor-pointer"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
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
