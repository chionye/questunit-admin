import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { serviceTypesApi, servicesApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest, Service } from '@/types';

const emptyForm = { serviceId: '', name: '', description: '', price: undefined as number | undefined, duration: undefined as number | undefined };

function TableSkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ServiceTypesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceType | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: response, isLoading, error } = useQuery({ queryKey: ['serviceTypes'], queryFn: serviceTypesApi.getAll });
  const { data: servicesResponse } = useQuery({ queryKey: ['services'], queryFn: servicesApi.getAll });

  const serviceTypes: ServiceType[] = response ? (extractData(response) as ServiceType[] ?? []) : [];
  const services: Service[] = servicesResponse ? (extractData(servicesResponse) as Service[] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceTypeRequest) => serviceTypesApi.create(data),
    onSuccess: () => { toast.success('Service type created'); queryClient.invalidateQueries({ queryKey: ['serviceTypes'] }); closeModal(); },
    onError: () => toast.error('Failed to create service type'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeRequest }) => serviceTypesApi.update(id, data),
    onSuccess: () => { toast.success('Service type updated'); queryClient.invalidateQueries({ queryKey: ['serviceTypes'] }); closeModal(); },
    onError: () => toast.error('Failed to update service type'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceTypesApi.delete(id),
    onSuccess: () => { toast.success('Service type deleted'); queryClient.invalidateQueries({ queryKey: ['serviceTypes'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete service type'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditingType(null); setForm(emptyForm); };
  const openCreate = () => { setForm(emptyForm); setEditingType(null); setIsModalOpen(true); };
  const openEdit = (st: ServiceType) => {
    setEditingType(st);
    setForm({ serviceId: st.serviceId || '', name: st.name || '', description: st.description || '', price: st.price, duration: st.duration });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editingType) {
      const id = normalizeId(editingType as unknown as Record<string, unknown>);
      updateMutation.mutate({ id, data: { name: form.name, description: form.description, price: form.price, duration: form.duration } });
    } else {
      if (!form.serviceId) { toast.error('Please select a service'); return; }
      createMutation.mutate(form as CreateServiceTypeRequest);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Service Types"
        subtitle="Manage service type packages"
        actions={<Button onClick={openCreate}><Plus size={18} /><span className="max-sm:hidden">Add Type</span></Button>}
      />

      <Card className="overflow-hidden">
        {isLoading ? <TableSkeletonLoader /> : error ? (
          <div className="p-8 text-center"><p className="text-red-500">Failed to load service types</p></div>
        ) : serviceTypes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No service types yet</p>
            <p className="text-gray-300 text-sm mt-1">Create your first service type</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((st) => {
                const id = normalizeId(st as unknown as Record<string, unknown>);
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">{st.description || '—'}</TableCell>
                    <TableCell className="text-gray-600">{st.price != null ? `$${st.price}` : '—'}</TableCell>
                    <TableCell className="text-gray-600">{st.duration ? `${st.duration} min` : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(st)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(st)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Service Type' : 'Create Service Type'}</DialogTitle>
            <DialogDescription>{editingType ? 'Update the service type details' : 'Fill in the details'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingType && (
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={form.serviceId} onValueChange={(val) => setForm({ ...form, serviceId: val })}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={normalizeId(s as unknown as Record<string, unknown>)} value={normalizeId(s as unknown as Record<string, unknown>)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basic Package" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })} placeholder="25" />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration ?? ''} onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })} placeholder="60" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingType ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Type</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deleteMutation.mutate(normalizeId(deleteTarget as unknown as Record<string, unknown>)); } }} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
