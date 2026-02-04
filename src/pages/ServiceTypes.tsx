import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { serviceTypesApi, servicesApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/Skeleton';
import type { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest, Service } from '@/types';

const emptyForm = {
  serviceId: '',
  name: '',
  description: '',
  price: undefined as number | undefined,
  duration: undefined as number | undefined,
};

export function ServiceTypesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceType | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['serviceTypes'],
    queryFn: serviceTypesApi.getAll,
  });

  const { data: servicesResponse } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const serviceTypes: ServiceType[] = response ? (extractData(response) as ServiceType[] ?? []) : [];
  const services: Service[] = servicesResponse ? (extractData(servicesResponse) as Service[] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceTypeRequest) => serviceTypesApi.create(data),
    onSuccess: () => {
      toast.success('Service type created');
      queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
      closeModal();
    },
    onError: () => toast.error('Failed to create service type'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeRequest }) =>
      serviceTypesApi.update(id, data),
    onSuccess: () => {
      toast.success('Service type updated');
      queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update service type'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceTypesApi.delete(id),
    onSuccess: () => {
      toast.success('Service type deleted');
      queryClient.invalidateQueries({ queryKey: ['serviceTypes'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete service type'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingType(null);
    setIsModalOpen(true);
  };

  const openEdit = (st: ServiceType) => {
    setEditingType(st);
    setForm({
      serviceId: st.serviceId || '',
      name: st.name || '',
      description: st.description || '',
      price: st.price,
      duration: st.duration,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingType) {
      const id = normalizeId(editingType as unknown as Record<string, unknown>);
      updateMutation.mutate({
        id,
        data: { name: form.name, description: form.description, price: form.price, duration: form.duration },
      });
    } else {
      if (!form.serviceId) {
        toast.error('Please select a service');
        return;
      }
      createMutation.mutate(form as CreateServiceTypeRequest);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Service Types"
        subtitle="Manage service type packages"
        actions={
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
            onClick={openCreate}
          >
            <Plus size={18} />
            <span className="max-sm:hidden">Add Type</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load service types</p>
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No service types yet</p>
            <p className="text-gray-300 text-sm mt-1">Create your first service type</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {serviceTypes.map((st) => {
                  const id = normalizeId(st as unknown as Record<string, unknown>);
                  return (
                    <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{st.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{st.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{st.price != null ? `$${st.price}` : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{st.duration ? `${st.duration} min` : '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors cursor-pointer"
                            onClick={() => openEdit(st)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                            onClick={() => setDeleteTarget(st)}
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
        title={editingType ? 'Edit Service Type' : 'Create Service Type'}
        maxWidth="500px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Service *</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={normalizeId(s as unknown as Record<string, unknown>)} value={normalizeId(s as unknown as Record<string, unknown>)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Basic Package"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.price ?? ''}
                onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.duration ?? ''}
                onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="60"
              />
            </div>
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
              {isSaving ? 'Saving...' : editingType ? 'Update' : 'Create'}
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
        title="Delete Service Type"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
