import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import { userReportsApi } from '@/api/endpoints';
import { extractData } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserReport } from '@/types';

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate_behavior: 'Inappropriate behavior',
  fraud: 'Fraud or scam',
  violence: 'Threats or violence',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

function userName(user?: UserReport['reporter']) {
  if (!user) return '—';
  const profile = user.UserProfile;
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  }
  return user.phone ?? user.email ?? `User #${user.id}`;
}

export function UserReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailReport, setDetailReport] = useState<UserReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: reportsRes, isLoading } = useQuery({
    queryKey: ['user-reports', statusFilter],
    queryFn: () =>
      userReportsApi.getAll({
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const reports: UserReport[] = reportsRes ? ((extractData(reportsRes) as unknown as UserReport[]) ?? []) : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      userReportsApi.updateStatus(id, { status: status as UserReport['status'], adminNotes: notes }),
    onSuccess: () => {
      toast.success('Report updated');
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
      setDetailReport(null);
    },
    onError: () => toast.error('Failed to update report'),
  });

  const openDetail = (report: UserReport) => {
    setDetailReport(report);
    setAdminNotes(report.adminNotes ?? '');
  };

  const handleStatusChange = (report: UserReport, newStatus: string) => {
    updateMutation.mutate({ id: report.id, status: newStatus, notes: adminNotes });
  };

  return (
    <div className="p-6 space-y-6">
      <Header
        title="User Reports"
        subtitle="Reports submitted by renderers against requesters"
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Filter by status:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported Requester</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{userName(report.reportedUser)}</p>
                      <p className="text-xs text-gray-400">
                        {report.reportedUser?.phone ?? report.reportedUser?.email ?? ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{userName(report.reporter)}</p>
                      <p className="text-xs text-gray-400">
                        {report.reporter?.phone ?? report.reporter?.email ?? ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{REASON_LABELS[report.reason] ?? report.reason}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[report.status]} border-0 capitalize`}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(report)}
                      className="gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailReport} onOpenChange={(open) => !open && setDetailReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review the report and update its status.
            </DialogDescription>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-0.5">Reported Requester</p>
                  <p className="font-medium">{userName(detailReport.reportedUser)}</p>
                  <p className="text-gray-400 text-xs">
                    {detailReport.reportedUser?.phone ?? detailReport.reportedUser?.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Reported By (Renderer)</p>
                  <p className="font-medium">{userName(detailReport.reporter)}</p>
                  <p className="text-gray-400 text-xs">
                    {detailReport.reporter?.phone ?? detailReport.reporter?.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Reason</p>
                  <p className="font-medium">{REASON_LABELS[detailReport.reason] ?? detailReport.reason}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Date</p>
                  <p className="font-medium">
                    {new Date(detailReport.createdAt).toLocaleString('en-NG')}
                  </p>
                </div>
              </div>

              {detailReport.details && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Details from reporter</p>
                  <p className="text-sm bg-gray-50 rounded-lg p-3 border">{detailReport.details}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-500 block mb-1">Admin notes</label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes (optional)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {(['reviewed', 'resolved', 'dismissed'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={detailReport.status === s ? 'default' : 'outline'}
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => handleStatusChange(detailReport, s)}
                      className="capitalize">
                      Mark as {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
