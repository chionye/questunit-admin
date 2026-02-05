import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { servicesApi } from '@/api/endpoints';
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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import type { Service, CreateServiceRequest, UpdateServiceRequest } from '@/types';

const emptyForm: CreateServiceRequest = {
  name: '',
  description: '',
  category: '',
  basePrice: undefined,
  duration: undefined,
  status: 'active',
};

function TableSkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<CreateServiceRequest>(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const services: Service[] = response ? (extractData(response) as Service[] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceRequest) => servicesApi.create(data),
    onSuccess: () => { toast.success('Service created'); queryClient.invalidateQueries({ queryKey: ['services'] }); closeModal(); },
    onError: () => toast.error('Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) => servicesApi.update(id, data),
    onSuccess: () => { toast.success('Service updated'); queryClient.invalidateQueries({ queryKey: ['services'] }); closeModal(); },
    onError: () => toast.error('Failed to update service'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { toast.success('Service deleted'); queryClient.invalidateQueries({ queryKey: ['services'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete service'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditingService(null); setForm(emptyForm); };

  const openCreate = () => { setForm(emptyForm); setEditingService(null); setIsModalOpen(true); };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name || '', description: service.description || '', category: service.category || '', basePrice: service.basePrice, duration: service.duration, status: service.status || 'active' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editingService) {
      const id = normalizeId(editingService as unknown as Record<string, unknown>);
      updateMutation.mutate({ id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Services"
        subtitle="Manage available services"
        actions={
          <Button onClick={openCreate}>
            <Plus size={18} />
            <span className="max-sm:hidden">Add Service</span>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center"><p className="text-red-500">Failed to load services</p></div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No services yet</p>
            <p className="text-gray-300 text-sm mt-1">Create your first service to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                const id = normalizeId(service as unknown as Record<string, unknown>);
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-gray-600">{service.category || '—'}</TableCell>
                    <TableCell className="text-gray-600">{service.basePrice != null ? `$${service.basePrice}` : '—'}</TableCell>
                    <TableCell className="text-gray-600">{service.duration ? `${service.duration} min` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'active' ? 'success' : 'secondary'}>
                        {service.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(service)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(service)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create Service'}</DialogTitle>
            <DialogDescription>{editingService ? 'Update the service details' : 'Fill in the details for the new service'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Service description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. cleaning" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status || 'active'} onValueChange={(val) => setForm({ ...form, status: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price ($)</Label>
                <Input type="number" value={form.basePrice ?? ''} onChange={(e) => setForm({ ...form, basePrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="50" />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration ?? ''} onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })} placeholder="120" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingService ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  const id = normalizeId(deleteTarget as unknown as Record<string, unknown>);
                  deleteMutation.mutate(id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
