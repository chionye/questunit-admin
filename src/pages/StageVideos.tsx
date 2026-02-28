import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ChevronLeft, ExternalLink } from 'lucide-react';
import { videosApi } from '@/api/endpoints';
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
import type { ProgramVideo, CreateVideoRequest, UpdateVideoRequest } from '@/types';

const emptyForm: Omit<CreateVideoRequest, 'stageId'> = {
  title: '', youtubeUrl: '', category: '', level: '', difficulty: '', equipment: '', duration: '', order: 0,
};

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>YouTube</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 7 }).map((__, j) => (
              <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function StageVideosPage() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sid = Number(stageId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramVideo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramVideo | null>(null);
  const [form, setForm] = useState<Omit<CreateVideoRequest, 'stageId'>>(emptyForm);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['videos', sid],
    queryFn: () => videosApi.getByStage(sid),
    enabled: !!sid,
  });

  const videos: ProgramVideo[] = response ? (extractData(response) as ProgramVideo[] ?? []) : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateVideoRequest) => videosApi.create(data),
    onSuccess: () => {
      toast.success('Video added');
      queryClient.invalidateQueries({ queryKey: ['videos', sid] });
      closeModal();
    },
    onError: () => toast.error('Failed to add video'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVideoRequest }) =>
      videosApi.update(id, data),
    onSuccess: () => {
      toast.success('Video updated');
      queryClient.invalidateQueries({ queryKey: ['videos', sid] });
      closeModal();
    },
    onError: () => toast.error('Failed to update video'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => videosApi.delete(id),
    onSuccess: () => {
      toast.success('Video deleted');
      queryClient.invalidateQueries({ queryKey: ['videos', sid] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete video'),
  });

  const closeModal = () => { setIsModalOpen(false); setEditing(null); setForm(emptyForm); };

  const openCreate = () => { setForm({ ...emptyForm, order: videos.length }); setEditing(null); setIsModalOpen(true); };

  const openEdit = (v: ProgramVideo) => {
    setEditing(v);
    setForm({
      title: v.title, youtubeUrl: v.youtubeUrl, category: v.category ?? '',
      level: v.level ?? '', difficulty: v.difficulty ?? '', equipment: v.equipment ?? '',
      duration: v.duration ?? '', order: v.order ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.youtubeUrl.trim()) { toast.error('YouTube URL is required'); return; }
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate({ ...form, stageId: sid });
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match?.[1] ?? null;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Header
        title="Videos"
        subtitle={`Managing videos for stage #${sid}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} /> Back
            </Button>
            <Button onClick={openCreate} size="sm">
              <Plus size={18} />
              <span className="max-sm:hidden">Add Video</span>
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center"><p className="text-red-500">Failed to load videos</p></div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No videos yet</p>
            <p className="text-gray-300 text-sm mt-1">Add the first YouTube video to this stage</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>YouTube</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => {
                const ytId = getYoutubeId(v.youtubeUrl);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="text-muted-foreground">{v.order ?? '—'}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{v.title}</TableCell>
                    <TableCell className="text-muted-foreground">{v.duration || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{v.level || '—'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] truncate">{v.equipment || '—'}</TableCell>
                    <TableCell>
                      {ytId ? (
                        <a href={`https://youtube.com/watch?v=${ytId}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
                          Watch <ExternalLink size={12} />
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.isActive ? 'success' : 'secondary'}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </Badge>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Video' : 'Add Video'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 10mins Upper Body Burn: Core Finisher" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube URL *</Label>
              <Input id="youtubeUrl" value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" value={form.duration ?? ''}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 10mins" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input id="level" value={form.level ?? ''}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="e.g. Beginner" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Beginner Endurance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Input id="difficulty" value={form.difficulty ?? ''}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  placeholder="e.g. Beginner, Easy" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment</Label>
                <Input id="equipment" value={form.equipment ?? ''}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="e.g. Mat and Rope Needed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" type="number" min={0} value={form.order ?? 0}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
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
