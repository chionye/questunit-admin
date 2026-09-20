import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, X, Eye } from "lucide-react";
import { adminApi } from "@/api/endpoints";
import { extractData } from "@/hooks/useApiData";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: number;
  fee: number;
  netAmount: number;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  status: string;
  reference: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: number;
  notes?: string;
  User?: {
    phone?: string;
    email?: string;
    UserProfile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function PendingPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<WithdrawalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["pendingPayments", page],
    queryFn: () => adminApi.getPendingWithdrawals({ page, limit: PAGE_SIZE }),
  });

  const requests: WithdrawalRequest[] = response
    ? ((extractData(response) as WithdrawalRequest[]) ?? [])
    : [];
  const pagination = (response as any)?.data?.data?.pagination || {
    totalCount: 0,
    totalPages: 1,
  };

  const processMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: number; action: "approve" | "reject"; notes?: string }) =>
      adminApi.processWithdrawal(id, { action, notes }),
    onSuccess: (_, variables) => {
      toast.success(variables.action === "approve" ? "Withdrawal approved" : "Withdrawal rejected");
      queryClient.invalidateQueries({ queryKey: ["pendingPayments"] });
      setApproveTarget(null);
      setRejectTarget(null);
    },
    onError: () => toast.error("Failed to process withdrawal"),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openDetail = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "warning" | "success" | "danger" | "secondary"> = {
      pending: "warning",
      processing: "secondary",
      paid: "success",
      failed: "danger",
      cancelled: "danger",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div>
      <Header
        title="Pending Payments"
        subtitle="Review and process renderer withdrawal requests"
      />

      <Card className="overflow-x-auto">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load withdrawal requests</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-400 text-lg">No pending payments</p>
            <p className="text-gray-300 text-sm mt-1">All withdrawal requests have been processed</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Renderer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {req.User?.UserProfile?.firstName} {req.User?.UserProfile?.lastName || "—"}
                        </p>
                        <p className="text-xs text-gray-500">{req.User?.phone || req.User?.email || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(req.amount)}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(req.fee || 0)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(req.netAmount || req.amount)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{req.bankDetails?.bankName || "—"}</p>
                        <p className="text-xs text-gray-500">{req.bankDetails?.accountNumber || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(req.requestedAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(req)}>
                          <Eye size={16} />
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setApproveTarget(req)}
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setRejectTarget(req)}
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => !open && setIsDetailOpen(false)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Reference</p>
                  <p className="text-sm font-mono">{selectedRequest.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Renderer</p>
                  <p className="text-sm">
                    {selectedRequest.User?.UserProfile?.firstName} {selectedRequest.User?.UserProfile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedRequest.User?.phone || selectedRequest.User?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Requested At</p>
                  <p className="text-sm">{formatDate(selectedRequest.requestedAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Amount Details</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gross Amount</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedRequest.amount)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span className="text-sm">Withdrawal Fee</span>
                    <span className="text-sm">- {formatCurrency(selectedRequest.fee || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-sm">Net Amount</span>
                    <span className="text-sm text-green-600">{formatCurrency(selectedRequest.netAmount || selectedRequest.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Bank Details</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm"><span className="text-gray-500">Bank:</span> {selectedRequest.bankDetails?.bankName}</p>
                  <p className="text-sm"><span className="text-gray-500">Account Name:</span> {selectedRequest.bankDetails?.accountName}</p>
                  <p className="text-sm"><span className="text-gray-500">Account Number:</span> {selectedRequest.bankDetails?.accountNumber}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setRejectTarget(selectedRequest);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setApproveTarget(selectedRequest);
                    }}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this withdrawal of{" "}
              <strong>{approveTarget && formatCurrency(approveTarget.netAmount || approveTarget.amount)}</strong>?
              {"\n\n"}This will initiate the bank transfer to the renderer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveTarget && processMutation.mutate({ id: approveTarget.id, action: "approve" })}
              disabled={processMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {processMutation.isPending ? "Processing..." : "Approve & Pay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this withdrawal request? The funds will be refunded to the renderer's wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectTarget && processMutation.mutate({ id: rejectTarget.id, action: "reject" })}
              disabled={processMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {processMutation.isPending ? "Processing..." : "Reject & Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
