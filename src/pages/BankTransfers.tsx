import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { bankTransfersApi } from '@/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BankTransfer, BankTransferStatus } from '@/types';
import { apiErrorMessage } from '@/lib/utils';

const naira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatDate = (date: string | null) =>
  date
    ? new Date(date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', hour12: true })
    : '—';

const STATUS: Record<BankTransferStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  credited: { label: 'In wallet', variant: 'success' },
  missed: { label: 'Not in wallet', variant: 'danger' },
  no_wallet: { label: 'No matching renderer', variant: 'warning' },
};

const ORDER: BankTransferStatus[] = ['missed', 'no_wallet', 'credited'];

export function BankTransfersPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState('30');
  const [reference, setReference] = useState('');

  const { data: response, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['bank-transfers', days],
    queryFn: () => bankTransfersApi.getAll(Number(days)),
  });

  const transfers: BankTransfer[] = [...(response?.data?.data?.transfers ?? [])].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
  );
  const needsAttention = transfers.filter((t) => t.status !== 'credited').length;

  const creditMutation = useMutation({
    mutationFn: (ref: string) => bankTransfersApi.credit(ref),
    onSuccess: (res) => {
      const result = res.data.data;
      if (result?.status === 'credited') {
        const paid = result.commissionPaid ? `, ${naira(result.commissionPaid)} of it paid commission owed` : '';
        toast.success(`${naira(result.amount ?? 0)} added to the wallet${paid}`);
      } else {
        toast.success('This transfer was already in the wallet');
      }
      setReference('');
      queryClient.invalidateQueries({ queryKey: ['bank-transfers'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to credit transfer')),
  });

  const crediting = creditMutation.isPending ? creditMutation.variables : null;

  return (
    <>
      <Header
        title="Bank Transfers"
        subtitle="Transfers into renderers' Paystack account numbers, checked against their wallets"
        actions={
          <div className="flex items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          The server checks Paystack every 15 minutes and adds any transfer from the last 3 days that didn't reach a
          wallet, so most problems fix themselves. Anything marked in red below still needs attention.
        </p>

        {!isLoading && !error && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              needsAttention ? 'border-destructive/40 bg-destructive/5' : 'bg-card'
            }`}>
            {needsAttention
              ? `${needsAttention} transfer${needsAttention === 1 ? '' : 's'} paid on Paystack but not in a wallet.`
              : `All ${transfers.length} transfer${transfers.length === 1 ? '' : 's'} in this period are in wallets.`}
          </div>
        )}

        <div className="rounded-xl border bg-card">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-muted-foreground">
              {apiErrorMessage(error, 'Failed to load bank transfers from Paystack')}
            </div>
          ) : transfers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No bank transfers in this period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paid</TableHead>
                  <TableHead>Renderer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">From</TableHead>
                  <TableHead className="hidden xl:table-cell">Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t) => (
                  <TableRow key={t.reference}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.paidAt)}</TableCell>
                    <TableCell>
                      {t.user ? (
                        <div>
                          <div className="font-medium">{t.user.name || t.user.email}</div>
                          <div className="text-xs text-muted-foreground">{t.user.email}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-muted-foreground">Unknown</div>
                          <div className="text-xs text-muted-foreground">
                            Account {t.receiverAccountNumber || '—'} · {t.customerEmail || 'no email'}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{naira(t.amount)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {[t.senderName, t.senderBank].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell font-mono text-xs">{t.reference}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS[t.status].variant}>{STATUS[t.status].label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === 'missed' ? (
                        <Button
                          size="sm"
                          onClick={() => creditMutation.mutate(t.reference)}
                          disabled={creditMutation.isPending}>
                          {crediting === t.reference ? 'Adding…' : 'Add to wallet'}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <form
          className="rounded-xl border bg-card p-4 space-y-3 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (reference.trim()) creditMutation.mutate(reference.trim());
          }}>
          <div className="space-y-2">
            <Label htmlFor="reference">Add a transfer by Paystack reference</Label>
            <p className="text-xs text-muted-foreground">
              For a transfer older than this list, or one a renderer reports. Find the reference in the Paystack
              dashboard under Transactions. The amount and renderer are taken from Paystack, and a transfer already in
              a wallet is never added twice.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 100004261104090012345678901234"
            />
            <Button type="submit" disabled={!reference.trim() || creditMutation.isPending}>
              Add
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
