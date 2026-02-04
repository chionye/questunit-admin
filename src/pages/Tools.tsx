import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toolsApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/Skeleton';
import type { Tool, CreateToolRequest, UpdateToolRequest } from '@/types';

const emptyForm: CreateToolRequest = {
  name: '',
  description: '',
  category: '',
  basePrice: undefined,
  status: 'active',
};

export function ToolsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [form, setForm] = useState<CreateToolRequest>(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['tools'],
    queryFn: toolsApi.getAll,
  });

  const tools: Tool[] = response ? (extractData(response) as Tool[] ?? []) : [];

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
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
            onClick={openCreate}
          >
            <Plus size={18} />
            <span className="max-sm:hidden">Add Tool</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tools.map((tool) => {
                  const id = normalizeId(tool as unknown as Record<string, unknown>);
                  return (
                    <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{tool.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tool.category || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tool.basePrice != null ? `$${tool.basePrice}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tool.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tool.status || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors cursor-pointer"
                            onClick={() => openEdit(tool)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                            onClick={() => setDeleteTarget(tool)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTool ? 'Edit Tool' : 'Create Tool'}
        maxWidth="550px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tool name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tool description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. cleaning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price ($)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={form.basePrice ?? ''}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="25"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : editingTool ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const id = normalizeId(deleteTarget as unknown as Record<string, unknown>);
            deleteMutation.mutate(id);
          }
        }}
        title="Delete Tool"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
