import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toolsApi, serviceTypesApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
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
import type { Tool, CreateToolRequest, UpdateToolRequest, ServiceType } from '@/types';

const emptyForm: CreateToolRequest = {
  name: '',
  description: '',
  category: '',
  basePrice: undefined,
  status: 'active',
  serviceTypeId: undefined,
};

function ToolsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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

export function ToolsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [form, setForm] = useState<CreateToolRequest>(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['tools', page],
    queryFn: () => toolsApi.getAll({ page, limit: PAGE_SIZE }),
  });

  const { data: serviceTypesRes } = useQuery({
    queryKey: ['service-types', 'all'],
    queryFn: () => serviceTypesApi.getAll({ limit: 100 }),
  });
  const serviceTypes: ServiceType[] = serviceTypesRes ? (extractData(serviceTypesRes) as ServiceType[] ?? []) : [];

  const tools: Tool[] = response ? (extractData(response) as Tool[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: CreateToolRequest) => toolsApi.create(data),
    onSuccess: () => {
      toast.success('Tool created');
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      closeModal();
    },
    onError: () => toast.error('Failed to create tool'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateToolRequest }) =>
      toolsApi.update(id, data),
    onSuccess: () => {
      toast.success('Tool updated');
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update tool'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.delete(id),
    onSuccess: () => {
      toast.success('Tool deleted');
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete tool'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingTool(null);
    setIsModalOpen(true);
  };

  const openEdit = (tool: Tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name || '',
      description: tool.description || '',
      category: tool.category || '',
      basePrice: tool.basePrice,
      status: tool.status || 'active',
      serviceTypeId: tool.serviceTypeId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingTool) {
      const id = normalizeId(editingTool as unknown as Record<string, unknown>);
      updateMutation.mutate({ id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Tools"
        subtitle="Manage available tools"
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus size={18} />
            <span className="max-sm:hidden">Add Tool</span>
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <ToolsTableSkeleton />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load tools</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No tools yet</p>
            <p className="text-gray-300 text-sm mt-1">Create your first tool to get started</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => {
                const id = normalizeId(tool as unknown as Record<string, unknown>);
                const stName = serviceTypes.find(st => String(st.id) === String(tool.serviceTypeId))?.name;
                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell className="text-muted-foreground">{stName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{tool.category || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={tool.status === 'active' ? 'success' : 'secondary'}>
                        {tool.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(tool)}
                          className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(tool)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
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
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit Tool' : 'Create Tool'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tool name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tool description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category || ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. cleaning"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status || 'active'}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                value={form.basePrice ?? ''}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="25"
              />
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
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingTool ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
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
