import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { stagesApi } from '@/api/endpoints';
import { extractData } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { ProgramStage, CreateStageRequest } from '@/types';

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Short Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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

export function ProgramStagesPage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pid = Number(programId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramStage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramStage | null>(null);
  const [form, setForm] = useState<Omit<CreateStageRequest, 'programId'>>({
    title: '', shortTitle: '', order: 0,
  });

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['stages', pid],
    queryFn: () => stagesApi.getByProgram(pid),
    enabled: !!pid,
  });

  const stages: ProgramStage[] = response ? (extractData(response) as ProgramStage[] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateStageRequest) => stagesApi.create(data),
    onSuccess: () => {
      toast.success('Stage created');
      queryClient.invalidateQueries({ queryKey: ['stages', pid] });
      closeModal();
    },
    onError: () => toast.error('Failed to create stage'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<CreateStageRequest, 'programId'> }) =>
      stagesApi.update(id, data),
    onSuccess: () => {
      toast.success('Stage updated');
      queryClient.invalidateQueries({ queryKey: ['stages', pid] });
      closeModal();
    },
    onError: () => toast.error('Failed to update stage'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stagesApi.delete(id),
    onSuccess: () => {
      toast.success('Stage deleted');
      queryClient.invalidateQueries({ queryKey: ['stages', pid] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete stage'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm({ title: '', shortTitle: '', order: 0 }); };

  const openCreate = () => { setForm({ title: '', shortTitle: '', order: stages.length }); setEditing(null); setIsModalOpen(true); };

  const openEdit = (s: ProgramStage) => {
    setEditing(s);
    setForm({ title: s.title, shortTitle: s.shortTitle ?? '', order: s.order ?? 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate({ ...form, programId: pid });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Stages"
        subtitle={`Managing stages for program #${pid}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/programs')}>
              <ChevronLeft size={16} /> Programs
            </Button>
            <Button onClick={openCreate} size="sm">
              <Plus size={18} />
              <span className="max-sm:hidden">Add Stage</span>
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center"><p className="text-red-500">Failed to load stages</p></div>
        ) : stages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No stages yet</p>
            <p className="text-gray-300 text-sm mt-1">Add the first stage to this program</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Short Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{s.order ?? '—'}</TableCell>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-muted-foreground">{s.shortTitle || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'success' : 'secondary'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}
                        className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/stages/${s.id}/videos`)}
                        className="ml-1 text-xs gap-1">
                        Videos <ChevronRight size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Stage' : 'Add Stage'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Stage 1 - Getting Started" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortTitle">Short Title</Label>
              <Input id="shortTitle" value={form.shortTitle ?? ''}
                onChange={(e) => setForm({ ...form, shortTitle: e.target.value })}
                placeholder="e.g. Getting Started" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input id="order" type="number" min={0} value={form.order ?? 0}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? All videos in this stage will also be deleted.
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
