import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Image } from 'lucide-react';
import { tasksApi } from '@/api/endpoints';
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
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types';

const emptyForm = {
  title: '',
  description: '',
  link: '',
  imageUrl: '',
  amount: '' as string | number,
  isActive: true,
};

function TasksTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
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

const PAGE_SIZE = 10;

export function TasksPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['tasks', page],
    queryFn: () => tasksApi.getAll({ page, limit: PAGE_SIZE }),
  });

  const tasks: Task[] = response ? (extractData(response) as Task[] ?? []) : [];
  const { totalPages, totalCount } = response ? extractPagination(response) : { totalPages: 1, totalCount: 0 };

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest | FormData) => tasksApi.create(data),
    onSuccess: () => {
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    },
    onError: () => toast.error('Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskRequest | FormData }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
    setImageFile(null);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      link: task.link || '',
      imageUrl: task.imageUrl || '',
      amount: typeof task.amount === 'string' ? task.amount : String(task.amount ?? ''),
      isActive: task.isActive,
    });
    setIsModalOpen(true);
  };

  const buildPayload = () => {
    const amountNum = typeof form.amount === 'string' ? parseFloat(form.amount) || 0 : form.amount;
    if (imageFile) {
      const fd = new FormData();
      fd.append('image', imageFile);
      fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.link) fd.append('link', form.link);
      fd.append('amount', String(amountNum));
      fd.append('isActive', String(form.isActive));
      return fd;
    }
    return { ...form, amount: amountNum };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const amountNum = typeof form.amount === 'string' ? parseFloat(form.amount) : form.amount;
    if (!amountNum || amountNum <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    const payload = buildPayload();
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: payload as any });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(isNaN(num) ? 0 : num);
  };

  return (
    <>
      <Header
        title="Tasks"
        subtitle="Manage referral tasks and rewards"
        actions={<Button onClick={openCreate}><Plus size={16} /> New Task</Button>}
      />

      <div className="p-6">
        <div className="rounded-xl border bg-card">
          {isLoading ? (
            <TasksTableSkeleton />
          ) : error ? (
            <div className="p-6 text-center text-muted-foreground">Failed to load tasks</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No tasks found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.imageUrl ? (
                        <img src={task.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Image size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                      {task.description || '—'}
                    </TableCell>
                    <TableCell>{formatCurrency(task.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={task.isActive ? 'default' : 'secondary'}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(task)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(task)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the task details below.' : 'Fill in the details to create a new referral task.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Join our Instagram community"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={form.link || ''}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="https://instagram.com/questunit"
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImageFile(file || null);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setForm({ ...form, imageUrl: url });
                  } else {
                    setForm({ ...form, imageUrl: editingTask?.imageUrl || '' });
                  }
                }}
              />
              {(form.imageUrl || editingTask?.imageUrl) && (
                <img src={form.imageUrl || editingTask?.imageUrl || ''} alt="preview" className="w-24 h-24 object-cover rounded-lg mt-2 border" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦) *</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                step={100}
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={form.isActive ? 'active' : 'inactive'}
                onValueChange={(v) => setForm({ ...form, isActive: v === 'active' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingTask ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
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
