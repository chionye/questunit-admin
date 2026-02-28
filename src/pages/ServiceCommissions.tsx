/** @format */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Pencil, Percent } from 'lucide-react';
import { servicesApi } from '@/api/endpoints';
import { extractData, normalizeId } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/types';

function TableSkeletonLoader() {
  return (
    <div className='p-4 space-y-4'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex gap-4'>
          <Skeleton className='h-5 w-36' />
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-16' />
          <Skeleton className='h-5 w-20 ml-auto' />
        </div>
      ))}
    </div>
  );
}

export function ServiceCommissionsPage() {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [commission, setCommission] = useState<string>('');

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const services: Service[] = response ? (extractData(response) as Service[] ?? []) : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      servicesApi.update(id, data),
    onSuccess: () => {
      toast.success('Commission updated');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingService(null);
    },
    onError: () => toast.error('Failed to update commission'),
  });

  const openEdit = (service: Service) => {
    setEditingService(service);
    setCommission(service.commissionPercentage != null ? String(service.commissionPercentage) : '10');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(commission);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }
    if (!editingService) return;
    const id = normalizeId(editingService as unknown as Record<string, unknown>);
    const fd = new FormData();
    fd.append('name', editingService.name);
    fd.append('commissionPercentage', String(val));
    updateMutation.mutate({ id, data: fd });
  };

  return (
    <div>
      <Header
        title='Service Commissions'
        subtitle="Set the platform's percentage taken per service rendered"
      />

      <Card className='overflow-hidden'>
        {isLoading ? (
          <TableSkeletonLoader />
        ) : error ? (
          <div className='p-8 text-center'><p className='text-red-500'>Failed to load services</p></div>
        ) : services.length === 0 ? (
          <div className='p-12 text-center'>
            <p className='text-gray-400 text-lg'>No services found</p>
            <p className='text-gray-300 text-sm mt-1'>Add services first, then set their commissions here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>Icon</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                const id = normalizeId(service as unknown as Record<string, unknown>);
                const comm = service.commissionPercentage != null
                  ? `${service.commissionPercentage}%`
                  : '10% (default)';
                return (
                  <TableRow key={id}>
                    <TableCell>
                      {service.iconUrl ? (
                        <img src={service.iconUrl} alt={service.name} className='h-8 w-8 object-contain' />
                      ) : (
                        <div className='h-8 w-8 rounded bg-gray-100 flex items-center justify-center'>
                          <Percent size={14} className='text-gray-400' />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>{service.name}</TableCell>
                    <TableCell className='text-gray-600'>{service.category || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'success' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className='font-semibold text-emerald-600'>{comm}</span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='ghost' size='icon' onClick={() => openEdit(service)}>
                        <Pencil size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Edit Commission — {editingService?.name}</DialogTitle>
            <DialogDescription>
              Set the percentage the platform takes for each completed service request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Commission Percentage (%)</Label>
              <div className='relative'>
                <Input
                  type='number'
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder='10'
                  min={0}
                  max={100}
                  step={0.5}
                  className='pr-8'
                />
                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>%</span>
              </div>
              <p className='text-xs text-gray-400'>
                e.g. 20 means the platform takes 20% of every payment for this service.
              </p>
            </div>
            <DialogFooter>
              <Button type='button' variant='secondary' onClick={() => setEditingService(null)}>Cancel</Button>
              <Button type='submit' disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
