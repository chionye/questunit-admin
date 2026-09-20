import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RotateCcw, Trash2, Search, AlertTriangle } from 'lucide-react';
import { usersApi } from '@/api/endpoints';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { RequesterUser } from '@/types';

function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 10;

type ConfirmAction = 'restore' | 'restore-all' | 'delete' | 'delete-all' | null;

export function RecycleBinPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['deleted-users', search, page],
    queryFn: () => usersApi.getDeleted({
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  const users: RequesterUser[] = response ? (extractData(response) as RequesterUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const restoreMutation = useMutation({
    mutationFn: (userId: string) => usersApi.restore(userId),
    onSuccess: () => {
      toast.success('User restored successfully');
      queryClient.invalidateQueries({ queryKey: ['deleted-users'] });
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to restore user'),
  });

  const restoreAllMutation = useMutation({
    mutationFn: () => usersApi.restoreAll(),
    onSuccess: () => {
      toast.success(`All users restored successfully`);
      queryClient.invalidateQueries({ queryKey: ['deleted-users'] });
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to restore users'),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.permanentDelete(userId),
    onSuccess: () => {
      toast.success('User permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['deleted-users'] });
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to permanently delete user'),
  });

  const permanentDeleteAllMutation = useMutation({
    mutationFn: () => usersApi.permanentDeleteAll(),
    onSuccess: () => {
      toast.success('All deleted users permanently removed');
      queryClient.invalidateQueries({ queryKey: ['deleted-users'] });
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to permanently delete users'),
  });

  const handleConfirm = () => {
    switch (confirmAction) {
      case 'restore':
        if (selectedId) restoreMutation.mutate(selectedId);
        break;
      case 'restore-all':
        restoreAllMutation.mutate();
        break;
      case 'delete':
        if (selectedId) permanentDeleteMutation.mutate(selectedId);
        break;
      case 'delete-all':
        permanentDeleteAllMutation.mutate();
        break;
    }
  };

  const isPending =
    restoreMutation.isPending ||
    restoreAllMutation.isPending ||
    permanentDeleteMutation.isPending ||
    permanentDeleteAllMutation.isPending;

  const confirmTitle = () => {
    switch (confirmAction) {
      case 'restore': return 'Restore User';
      case 'restore-all': return 'Restore All Users';
      case 'delete': return 'Permanently Delete User';
      case 'delete-all': return 'Permanently Delete All Users';
      default: return '';
    }
  };

  const confirmDescription = () => {
    switch (confirmAction) {
      case 'restore': return 'This will restore the user account and all associated data.';
      case 'restore-all': return 'This will restore all soft-deleted user accounts and their associated data.';
      case 'delete': return 'This action is irreversible. The user and all associated data will be permanently removed.';
      case 'delete-all': return 'This action is irreversible. All deleted users and their data will be permanently removed.';
      default: return '';
    }
  };

  return (
    <div>
      <Header
        title="Recycle Bin"
        subtitle="View and manage soft-deleted user accounts"
        actions={
          users.length > 0 ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedId(null); setConfirmAction('restore-all'); }}
                disabled={isPending}
              >
                <RotateCcw size={16} className="mr-1" />
                Restore All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { setSelectedId(null); setConfirmAction('delete-all'); }}
                disabled={isPending}
              >
                <Trash2 size={16} className="mr-1" />
                Delete All
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by email or phone..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
          {isFetching && searchInput !== search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load deleted users</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-lg">No deleted users found</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Deleted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const id = String(normalizeId(user as unknown as Record<string, unknown>));
                const profile = user.UserProfile;
                const name = profile?.firstName
                  ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
                  : '—';
                const deletedAt = (user as any).deletedAt || null;

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-gray-600">
                      <div>{user.email || '—'}</div>
                      <div className="text-xs text-gray-400">{user.phone || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {deletedAt ? new Date(deletedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() => { setSelectedId(id); setConfirmAction('restore'); }}
                          disabled={isPending}
                        >
                          <RotateCcw size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setSelectedId(id); setConfirmAction('delete'); }}
                          disabled={isPending}
                        >
                          <Trash2 size={16} />
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

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
