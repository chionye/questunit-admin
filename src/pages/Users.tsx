import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, Trash2, Search, Pencil } from 'lucide-react';
import { usersApi } from '@/api/endpoints';
import { extractData, extractPagination, normalizeId } from '@/hooks/useApiData';
import { useDebounce } from '@/hooks/useDebounce';
import { Pagination } from '@/components/ui/pagination';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import type { RequesterUser } from '@/types';

function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
    active: 'success',
    pending: 'warning',
    suspended: 'danger',
    banned: 'danger',
  };
  return <Badge variant={variants[status] ?? 'default'}>{status}</Badge>;
}

function VerificationLevelBadge({ onboardingStep, isOnboardingComplete }: { onboardingStep?: string | null; isOnboardingComplete?: boolean }) {
  if (isOnboardingComplete) return <Badge variant="success">Completed</Badge>;
  if (!onboardingStep) return <Badge variant="secondary">Not started</Badge>;
  const page1Steps = ['phone_verification', 'email_verification', 'profile_setup'];
  const page2Steps = ['service_selection', 'document_upload', 'tool_upload', 'verification_call'];
  if (page1Steps.includes(onboardingStep)) return <Badge variant="warning">Page 1</Badge>;
  if (page2Steps.includes(onboardingStep)) return <Badge variant="default">Page 2</Badge>;
  return <Badge variant="secondary">{onboardingStep}</Badge>;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  );
}

const PAGE_SIZE = 10;

export function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<RequesterUser | null>(null);
  const [viewingUser, setViewingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RequesterUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dob: '', gender: '', city: '', state: '', country: '', role: '', status: '',
  });

  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter, search, page],
    queryFn: () => usersApi.getAll({
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  const users: RequesterUser[] = response ? (extractData(response) as RequesterUser[] ?? []) : [];
  const { totalCount, totalPages } = response ? extractPagination(response) : { totalCount: 0, totalPages: 1 };

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const editMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: typeof editForm }) =>
      usersApi.updateProfile(userId, data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <div>
      <Header title="All Users" subtitle="Manage all user accounts — only admins can delete" />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
          {isFetching && searchInput !== search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}
        </div>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All roles</option>
          <option value="requester">Requester</option>
          <option value="renderer">Renderer</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load users</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">{search ? 'No users match your search' : 'No users found'}</p>
            {search && <p className="text-gray-300 text-sm mt-1">Try a different name, email or phone</p>}
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>NIN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const id = normalizeId(user as unknown as Record<string, unknown>);
                const profile = user.UserProfile;
                const name = profile?.firstName
                  ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
                  : '—';
                const ninDoc = user.Documents?.find((d) => d.type === 'nin');

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-gray-600">
                      <div>{user.email || '—'}</div>
                      <div className="text-xs text-gray-400">{user.phone || '—'}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {ninDoc?.documentNumber
                        ? <span className="font-mono text-xs">{ninDoc.documentNumber}</span>
                        : <span className="text-gray-300 text-xs">Not provided</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationLevelBadge
                        onboardingStep={user.onboardingStep}
                        isOnboardingComplete={user.isOnboardingComplete}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedUser(user); setViewingUser(true); }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditForm({
                              firstName: user.UserProfile?.firstName || '',
                              lastName: user.UserProfile?.lastName || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              dob: user.UserProfile?.dob || '',
                              gender: user.UserProfile?.gender || '',
                              city: user.UserProfile?.city || '',
                              state: user.UserProfile?.state || '',
                              country: user.UserProfile?.country || '',
                              role: user.role || '',
                              status: user.status || '',
                            });
                            setEditingUser(true);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(user)}
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
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewingUser && !!selectedUser} onOpenChange={(open) => { if (!open) setViewingUser(false); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Account, profile, and documents information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {selectedUser.UserProfile?.profilePhoto && (
                <div className="flex justify-center mb-2">
                  <img
                    src={selectedUser.UserProfile.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="First Name" value={selectedUser.UserProfile?.firstName} />
                <DetailRow label="Last Name" value={selectedUser.UserProfile?.lastName} />
                <DetailRow label="Email" value={selectedUser.email} />
                <DetailRow label="Phone" value={selectedUser.phone} />
                <DetailRow label="Role" value={selectedUser.role} />
                <DetailRow label="Status" value={selectedUser.status} />
                <DetailRow label="Date of Birth" value={selectedUser.UserProfile?.dob} />
                <DetailRow label="Gender" value={selectedUser.UserProfile?.gender} />
                <DetailRow label="City" value={selectedUser.UserProfile?.city} />
                <DetailRow label="State" value={selectedUser.UserProfile?.state} />
                <DetailRow label="Country" value={selectedUser.UserProfile?.country} />
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Service Activity</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.completed ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Completed</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.cancelled ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Cancelled</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedUser.serviceCounts?.pending ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Pending</div>
                  </div>
                </div>
              </div>
              {selectedUser.Documents && selectedUser.Documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {selectedUser.Documents.map((doc, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={doc.type === 'nin' ? 'default' : 'secondary'} className="text-xs">
                              {doc.type === 'nin' ? 'NIN' : doc.type === 'guarantor' ? 'Guarantor' : doc.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'danger' : 'secondary'} className="text-xs">
                              {doc.status}
                            </Badge>
                          </div>
                          {doc.type === 'guarantor' ? (
                            <div className="text-sm space-y-0.5">
                              <div><span className="text-gray-500">Name:</span> {doc.notes}</div>
                              <div><span className="text-gray-500">Phone:</span> <span className="font-mono">{doc.url}</span></div>
                              <div><span className="text-gray-500">NIN:</span> <span className="font-mono">{doc.documentNumber}</span></div>
                            </div>
                          ) : (
                            <div className="text-sm space-y-0.5">
                              {doc.documentNumber && <div><span className="text-gray-500">Number:</span> <span className="font-mono">{doc.documentNumber}</span></div>}
                              {doc.url && <div><span className="text-gray-500">File:</span> <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a></div>}
                              {doc.notes && <div><span className="text-gray-500">Notes:</span> {doc.notes}</div>}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                const id = String(normalizeId(deleteTarget as unknown as Record<string, unknown>));
                deleteMutation.mutate(id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editingUser && !!selectedUser} onOpenChange={(open) => { if (!open) { setEditingUser(false); setSelectedUser(null); } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update the user's information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setEditingUser(false); setSelectedUser(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!selectedUser) return;
              const userId = String(normalizeId(selectedUser as unknown as Record<string, unknown>));
              editMutation.mutate({ userId, data: editForm });
            }} disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
