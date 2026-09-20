import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { appVersionsApi } from '@/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppVersion, CreateAppVersionRequest, UpdateAppVersionRequest } from '@/types';

const emptyForm = {
  platform: 'ios' as 'ios' | 'android',
  version: '',
  minimumVersion: '1.0.0',
  buildNumber: '',
  storeUrl: '',
  releaseNotes: '',
  isRequired: false,
};

function AppVersionsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Platform</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Min Version</TableHead>
          <TableHead>Required</TableHead>
          <TableHead>Release Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 2 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-64" /></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AppVersionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppVersion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['app-versions'],
    queryFn: () => appVersionsApi.getAll(),
  });

  const versions: AppVersion[] = response?.data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateAppVersionRequest) => appVersionsApi.create(data),
    onSuccess: () => {
      toast.success('App version created');
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      closeModal();
    },
    onError: () => toast.error('Failed to create app version'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAppVersionRequest }) =>
      appVersionsApi.update(id, data),
    onSuccess: () => {
      toast.success('App version updated');
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update app version'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => appVersionsApi.delete(id),
    onSuccess: () => {
      toast.success('App version deleted');
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete app version'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVersion(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingVersion(null);
    setIsModalOpen(true);
  };

  const openEdit = (v: AppVersion) => {
    setEditingVersion(v);
    setForm({
      platform: v.platform,
      version: v.version,
      minimumVersion: v.minimumVersion || '1.0.0',
      buildNumber: v.buildNumber || '',
      storeUrl: v.storeUrl || '',
      releaseNotes: v.releaseNotes || '',
      isRequired: v.isRequired,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.version.trim()) {
      toast.error('Version is required');
      return;
    }
    const payload = {
      ...form,
      buildNumber: form.buildNumber || undefined,
      storeUrl: form.storeUrl || undefined,
      releaseNotes: form.releaseNotes || undefined,
    };
    if (editingVersion) {
      updateMutation.mutate({ id: editingVersion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Header
        title="App Versions"
        subtitle="Manage the latest app version users are prompted to update to"
        actions={<Button onClick={openCreate}><Plus size={16} /> New Version</Button>}
      />

      <div className="p-6">
        <div className="rounded-xl border bg-card">
          {isLoading ? (
            <AppVersionsTableSkeleton />
          ) : error ? (
            <div className="p-6 text-center text-muted-foreground">Failed to load app versions</div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No app versions configured yet. Create one to start prompting users to update.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead className="hidden md:table-cell">Min Version</TableHead>
                  <TableHead className="hidden md:table-cell">Build</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="hidden lg:table-cell">Release Notes</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium capitalize">{v.platform}</TableCell>
                    <TableCell className="font-mono">{v.version}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">{v.minimumVersion || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">{v.buildNumber || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={v.isRequired ? 'default' : 'secondary'}>
                        {v.isRequired ? 'Required' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[280px] truncate">
                      {v.releaseNotes || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {formatDate(v.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(v)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(v)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Users running a version older than the latest will be prompted to update on app open.
          If the user's version is below the minimum version, the update is forced.
        </p>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVersion ? 'Edit App Version' : 'New App Version'}</DialogTitle>
            <DialogDescription>
              {editingVersion
                ? 'Update the version details below.'
                : 'Set the latest version to prompt users to update to.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v as 'ios' | 'android' })}>
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Latest Version *</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="e.g. 1.6.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumVersion">Minimum Version</Label>
                <Input
                  id="minimumVersion"
                  value={form.minimumVersion}
                  onChange={(e) => setForm({ ...form, minimumVersion: e.target.value })}
                  placeholder="e.g. 1.5.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buildNumber">Build Number</Label>
                <Input
                  id="buildNumber"
                  value={form.buildNumber}
                  onChange={(e) => setForm({ ...form, buildNumber: e.target.value })}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeUrl">Store URL</Label>
                <Input
                  id="storeUrl"
                  value={form.storeUrl}
                  onChange={(e) => setForm({ ...form, storeUrl: e.target.value })}
                  placeholder="https://apps.apple.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="releaseNotes">Release Notes</Label>
              <Textarea
                id="releaseNotes"
                value={form.releaseNotes}
                onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })}
                placeholder="What's new in this version?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isRequired">Update Type</Label>
              <Select
                value={form.isRequired ? 'required' : 'optional'}
                onValueChange={(v) => setForm({ ...form, isRequired: v === 'required' })}>
                <SelectTrigger id="isRequired">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="required">Required (force update)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Required means users below the minimum version cannot use the app until they update.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingVersion ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {deleteTarget?.platform} version {deleteTarget?.version}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
