import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AxiosResponse } from "axios";
import { Send, Mail, Users, User } from "lucide-react";
import { emailsApi } from "@/api/endpoints";
import { extractData } from "@/hooks/useApiData";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import type {
  EmailRecipient,
  BulkSendResult,
  SendEmailResult,
  ApiResponse,
} from "@/types";

const PAGE_SIZE = 10;

type SendMode = "single" | "bulk";

const ROLE_OPTIONS = [
  { value: "requester", label: "Requesters" },
  { value: "renderer", label: "Renderers" },
  { value: "admin", label: "Admins" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

const recipientName = (r: EmailRecipient) =>
  [r.UserProfile?.firstName, r.UserProfile?.lastName].filter(Boolean).join(" ") ||
  r.email ||
  `User #${r.id}`;

export function EmailsPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SendMode>("single");
  const [subject, setSubject] = useState("");
  const [mailTitle, setMailTitle] = useState("");
  const [body, setBody] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkSendResult | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["emailRecipients", mode, search, role, status, page],
    queryFn: () =>
      emailsApi.getRecipients({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: mode === "bulk" ? role || undefined : undefined,
        status: mode === "bulk" ? status || undefined : undefined,
      }),
    staleTime: 15_000,
  });

  const recipients: EmailRecipient[] = response
    ? ((extractData(response) as EmailRecipient[]) ?? [])
    : [];

  const totalCount =
    (response as any)?.data?.data?.totalCount ??
    (response as any)?.data?.totalCount ??
    0;
  const totalPages =
    (response as any)?.data?.data?.totalPages ??
    (response as any)?.data?.totalPages ??
    1;

  const sendMutation = useMutation<
    AxiosResponse<ApiResponse<SendEmailResult | BulkSendResult>>,
    Error,
    void
  >({
    mutationFn: () => {
      if (mode === "single") {
        if (!selectedId) throw new Error("Select a recipient");
        return emailsApi.send({
          userId: selectedId,
          subject,
          mailTitle: mailTitle || subject,
          body,
        });
      }
      return emailsApi.sendBulk({
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
        subject,
        mailTitle: mailTitle || subject,
        body,
      });
    },
    onSuccess: (res) => {
      if (mode === "single") {
        toast.success("Email sent successfully");
      } else {
        const result = extractData(res) as BulkSendResult;
        setBulkResult(result);
        toast.success(
          `Sent ${result.sentCount} of ${result.totalRecipients} emails`
        );
      }
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["emailRecipients"] });
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message || err.message || "Failed to send email"
      );
    },
  });

  const canSend =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (mode === "single" ? selectedId !== null : totalCount > 0);

  const handleSendClick = () => setConfirmOpen(true);

  return (
    <div>
      <Header
        title="Send Emails"
        subtitle="Compose and send professional emails to users — individually or in bulk"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Compose
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Welcome to Quest Unit"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="mailTitle">Heading (optional)</Label>
              <Input
                id="mailTitle"
                placeholder="e.g. Welcome aboard!"
                value={mailTitle}
                onChange={(e) => setMailTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Write your message here. Line breaks are preserved."
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSendClick}
                disabled={!canSend || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
                {sendMutation.isPending
                  ? "Sending..."
                  : mode === "single"
                    ? "Send Email"
                    : `Send to ${totalCount} recipient${totalCount === 1 ? "" : "s"}`}
              </Button>
              {mode === "bulk" && totalCount > 0 && (
                <p className="text-sm text-gray-500">
                  Matches your filter: <strong>{totalCount}</strong>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Recipient selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recipients
          </h2>

          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("single");
                setPage(1);
                setBulkResult(null);
              }}
            >
              <User className="h-4 w-4" />
              Single
            </Button>
            <Button
              variant={mode === "bulk" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("bulk");
                setPage(1);
                setBulkResult(null);
              }}
            >
              <Users className="h-4 w-4" />
              Bulk
            </Button>
          </div>

          {mode === "bulk" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    {ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No users with an email address found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => mode === "single" && setSelectedId(r.id)}
                    >
                      <TableCell>
                        {mode === "single" && (
                          <input
                            type="radio"
                            name="recipient"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                            className="accent-primary cursor-pointer"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {recipientName(r)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {r.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "active"
                              ? "success"
                              : r.status === "suspended" || r.status === "banned"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </Card>
      </div>

      {bulkResult && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-2">Bulk email summary</h3>
          <div className="flex gap-6 mb-4">
            <p className="text-sm">
              Total: <strong>{bulkResult.totalRecipients}</strong>
            </p>
            <p className="text-sm text-green-600">
              Sent: <strong>{bulkResult.sentCount}</strong>
            </p>
            <p className="text-sm text-red-500">
              Failed: <strong>{bulkResult.failedCount}</strong>
            </p>
          </div>
          {bulkResult.failedCount > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkResult.results
                  .filter((r) => !r.sent)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.email}</TableCell>
                      <TableCell className="text-sm text-red-500">
                        {r.error}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm sending email</AlertDialogTitle>
            <AlertDialogDescription>
              {mode === "single"
                ? "This email will be sent to the selected recipient."
                : `This email will be sent to ${totalCount} recipient${totalCount === 1 ? "" : "s"} matching your filter.`}
              {"\n\n"}Subject: <strong>{subject}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              {sendMutation.isPending ? "Sending..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
