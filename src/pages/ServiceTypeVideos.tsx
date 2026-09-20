import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { serviceTypeVideosApi, servicesApi, serviceTypesApi } from '@/api/endpoints';
import { extractData } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ServiceTypeVideo, CreateServiceTypeVideoRequest, Service, ServiceType } from '@/types';

const emptyForm: CreateServiceTypeVideoRequest = { title: '', videoUrl: '', serviceId: null, serviceTypeIds: [], isActive: true };

export function ServiceTypeVideosPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTypeVideo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeVideo | null>(null);
  const [form, setForm] = useState<CreateServiceTypeVideoRequest>(emptyForm);

  const { data: videosRes, isLoading } = useQuery({
    queryKey: ['service-type-videos'],
    queryFn: serviceTypeVideosApi.getAll,
  });

  const { data: servicesRes } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => servicesApi.getAll({ limit: 100 }),
  });

  const { data: serviceTypesRes } = useQuery({
    queryKey: ['service-types', 'all'],
    queryFn: () => serviceTypesApi.getAll({ limit: 100 }),
  });

  const videos: ServiceTypeVideo[] = videosRes ? (extractData(videosRes) as ServiceTypeVideo[] ?? []) : [];
  const services: Service[] = servicesRes ? (extractData(servicesRes) as Service[] ?? []) : [];
  const allServiceTypes: ServiceType[] = serviceTypesRes ? (extractData(serviceTypesRes) as ServiceType[] ?? []) : [];

  const filteredServiceTypes = form.serviceId
    ? allServiceTypes.filter((st) => String(st.serviceId) === String(form.serviceId))
    : allServiceTypes;

  const createMutation = useMutation({
    mutationFn: serviceTypeVideosApi.create,
    onSuccess: () => { toast.success('Video added'); queryClient.invalidateQueries({ queryKey: ['service-type-videos'] }); closeModal(); },
    onError: () => toast.error('Failed to add video'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateServiceTypeVideoRequest }) => serviceTypeVideosApi.update(id, data),
    onSuccess: () => { toast.success('Video updated'); queryClient.invalidateQueries({ queryKey: ['service-type-videos'] }); closeModal(); },
    onError: () => toast.error('Failed to update video'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceTypeVideosApi.delete(id),
    onSuccess: () => { toast.success('Video deleted'); queryClient.invalidateQueries({ queryKey: ['service-type-videos'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete video'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm(emptyForm); };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setIsModalOpen(true); };

  const openEdit = (v: ServiceTypeVideo) => {
    setEditing(v);
    setForm({ title: v.title, videoUrl: v.videoUrl, serviceId: v.serviceId, serviceTypeIds: v.serviceTypeIds ?? [], isActive: v.isActive });
    setIsModalOpen(true);
  };

  const toggleServiceType = (id: number) => {
    setForm((prev) => ({
      ...prev,
      serviceTypeIds: prev.serviceTypeIds.includes(id)
        ? prev.serviceTypeIds.filter((x) => x !== id)
        : [...prev.serviceTypeIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.videoUrl.trim()) { toast.error('Video URL is required'); return; }
    if (form.serviceTypeIds.length === 0) { toast.error('Select at least one service type'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const getServiceTypeName = (id: number) => allServiceTypes.find((st) => Number(st.id) === id)?.name ?? String(id);

  return (
    <div>
      <Header
        title="Service Type Videos"
        subtitle="Add video links and assign them to service types"
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus size={18} />
            <span className="max-sm:hidden">Add Video</span>
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No videos yet</p>
            <p className="text-gray-300 text-sm mt-1">Add a video link and assign it to service types</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Service Types</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{v.title}</p>
                      <a href={v.videoUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                        {v.videoUrl.slice(0, 50)}{v.videoUrl.length > 50 ? '…' : ''}
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(v.serviceTypeIds ?? []).length === 0
                        ? <span className="text-xs text-gray-400">None</span>
                        : (v.serviceTypeIds ?? []).map((id) => (
                          <Badge key={id} variant="secondary" className="text-xs">{getServiceTypeName(id)}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.isActive ? 'success' : 'secondary'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)}
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(v)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Video' : 'Add Video'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the video details below.' : 'Add a service type video.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Car Washing Full Tutorial" />
            </div>

            <div className="space-y-2">
              <Label>Video URL *</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="space-y-2">
              <Label>Service (to filter service types)</Label>
              <Select
                value={form.serviceId ? String(form.serviceId) : ''}
                onValueChange={(v) => setForm({ ...form, serviceId: v ? Number(v) : null, serviceTypeIds: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign to Service Types * <span className="text-xs text-gray-400">(tick all that apply)</span></Label>
              {filteredServiceTypes.length === 0 ? (
                <p className="text-sm text-gray-400">No service types found</p>
              ) : (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {filteredServiceTypes.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={form.serviceTypeIds.includes(Number(st.id))}
                        onChange={() => toggleServiceType(Number(st.id))}
                        className="w-4 h-4 accent-green-500"
                      />
                      <span className="text-sm">{st.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {form.serviceTypeIds.length > 0 && (
                <p className="text-xs text-green-600">{form.serviceTypeIds.length} selected</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-green-500" />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving...' : editing ? 'Update' : 'Add Video'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
