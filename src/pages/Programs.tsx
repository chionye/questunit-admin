import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { programsApi, serviceTypesApi } from '@/api/endpoints';
import { extractData, extractPagination } from '@/hooks/useApiData';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Program, CreateProgramRequest, ServiceType } from '@/types';

const emptyForm: CreateProgramRequest = { title: '', description: '', isActive: true, order: 0, serviceTypeId: undefined };

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const PAGE_SIZE = 10;

export function ProgramsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [form, setForm] = useState<CreateProgramRequest>(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['programs', page],
    queryFn: () => programsApi.getAll({ page, limit: PAGE_SIZE }),
  });

  const { data: serviceTypesRes } = useQuery({
    queryKey: ['service-types', 'all'],
    queryFn: () => serviceTypesApi.getAll({ limit: 100 }),
  });
  const serviceTypes: ServiceType[] = serviceTypesRes ? (extractData(serviceTypesRes) as ServiceType[] ?? []) : [];

  const programs: Program[] = response ? (extractData(response) as Program[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: programsApi.create,
    onSuccess: () => {
      toast.success('Program created');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
    onError: () => toast.error('Failed to create program'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProgramRequest }) =>
      programsApi.update(id, data),
    onSuccess: () => {
      toast.success('Program updated');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update program'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => programsApi.delete(id),
    onSuccess: () => {
      toast.success('Program deleted');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete program'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm(emptyForm); };

  const openCreate = () => { setForm(emptyForm); setEditing(null); setIsModalOpen(true); };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description ?? '', isActive: p.isActive ?? true, order: p.order ?? 0, serviceTypeId: p.serviceTypeId });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Programs"
        subtitle="Manage training programs for renderers"
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus size={18} />
            <span className="max-sm:hidden">Add Program</span>
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center"><p className="text-red-500">Failed to load programs</p></div>
        ) : programs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No programs yet</p>
            <p className="text-gray-300 text-sm mt-1">Create your first program to get started</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => {
                const stName = serviceTypes.find(st => String(st.id) === String(p.serviceTypeId))?.name;
                return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">{stName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'success' : 'secondary'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/programs/${p.id}/stages`)}
                        className="ml-1 text-xs gap-1">
                        Stages <ChevronRight size={14} />
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
      </div>

      {/* Create / Edit */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Program' : 'Create Program'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Kids Basic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of this program" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={form.serviceTypeId ? String(form.serviceTypeId) : ''}
                onValueChange={(v) => setForm({ ...form, serviceTypeId: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st.id} value={String(st.id)}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" type="number" min={0} value={form.order ?? 0}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isActive ?? true}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-green-500" />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? All its stages and videos will also be deleted.
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
