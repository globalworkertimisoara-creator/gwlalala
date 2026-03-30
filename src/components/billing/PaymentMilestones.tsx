import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Loader2, CheckCircle2, Clock, CircleDashed, Target,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateBillingPayment, type BillingPayment } from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const MILESTONE_LABELS = ['1st Payment', '2nd Payment', '3rd Payment', '4th Payment'];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  paid: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  failed: { icon: CircleDashed, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  refunded: { icon: CircleDashed, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
};

interface PaymentMilestonesProps {
  billingRecordId: string;
  totalAmount: number;
  currency: string;
  payments: BillingPayment[];
}

export function PaymentMilestones({ billingRecordId, totalAmount, currency, payments }: PaymentMilestonesProps) {
  const { can } = usePermissions();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const paidPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  const remaining = totalAmount - totalPaid - totalPending;
  const canAddMore = payments.length < 4;

  return (
    <div className="space-y-5">
      {/* Overview bar */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Payment Progress</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {paidPercent.toFixed(0)}% Complete
          </span>
        </div>
        <Progress value={paidPercent} className="h-3" />
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Paid</p>
            <p className="text-sm font-bold text-green-600">{totalPaid.toLocaleString()} {currency}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-sm font-bold text-amber-600">{totalPending.toLocaleString()} {currency}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Remaining</p>
            <p className="text-sm font-bold text-muted-foreground">{Math.max(0, remaining).toLocaleString()} {currency}</p>
          </div>
        </div>
      </div>

      {/* Milestone cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {payments.map((payment, index) => {
          const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          return (
            <Card key={payment.id} className={`border ${config.bg} transition-all`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold bg-background border ${config.color}`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold">{MILESTONE_LABELS[index] || `Payment ${index + 1}`}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${config.color} border-current`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {payment.status}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold">{Number(payment.amount).toLocaleString()} {currency}</span>
                  <span className="text-sm text-muted-foreground font-medium">{Number(payment.percentage)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{payment.payment_method || 'No method specified'}</span>
                  <span>{payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : 'No date'}</span>
                </div>
                {payment.reference_number && (
                  <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty milestone slots */}
        {canAddMore && can('manageBilling') && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all cursor-pointer min-h-[140px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add Milestone {payments.length + 1} of 4</span>
            <span className="text-xs">Click to add a payment part</span>
          </button>
        )}
      </div>

      {/* Info text */}
      {payments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No payment milestones set up yet. Add up to 4 payment parts that make up the total amount.
        </p>
      )}

      {payments.length >= 4 && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum of 4 payment milestones reached.
        </p>
      )}

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AddMilestoneDialog
          billingRecordId={billingRecordId}
          totalAmount={totalAmount}
          currency={currency}
          milestoneNumber={payments.length + 1}
          existingPercentage={payments.reduce((s, p) => s + Number(p.percentage), 0)}
          onClose={() => setShowAddDialog(false)}
        />
      </Dialog>
    </div>
  );
}

function AddMilestoneDialog({
  billingRecordId, totalAmount, currency, milestoneNumber, existingPercentage, onClose,
}: {
  billingRecordId: string; totalAmount: number; currency: string;
  milestoneNumber: number; existingPercentage: number; onClose: () => void;
}) {
  const createPayment = useCreateBillingPayment();
  const { toast } = useToast();
  const [usePercentage, setUsePercentage] = useState(true);
  const [percentage, setPercentage] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  const remainingPercent = Math.max(0, 100 - existingPercentage);
  const remainingAmount = Math.max(0, totalAmount * (remainingPercent / 100));

  const handlePercentageChange = (val: string) => {
    const num = parseFloat(val);
    setPercentage(val);
    if (!isNaN(num) && totalAmount > 0) {
      setAmount(((num / 100) * totalAmount).toFixed(2));
    } else {
      setAmount('');
    }
  };

  const handleAmountChange = (val: string) => {
    const num = parseFloat(val);
    setAmount(val);
    if (!isNaN(num) && totalAmount > 0) {
      setPercentage(((num / totalAmount) * 100).toFixed(2));
    } else {
      setPercentage('');
    }
  };

  const isValid = amount && percentage && parseFloat(percentage) > 0 && parseFloat(percentage) <= remainingPercent + 0.01;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await createPayment.mutateAsync({
        billing_record_id: billingRecordId,
        amount: parseFloat(amount),
        percentage: parseFloat(percentage),
        payment_date: paymentDate || undefined,
        payment_method: method || undefined,
        reference_number: reference || undefined,
        status,
        notes: notes || undefined,
      });
      toast({ title: `Milestone ${milestoneNumber} added` });
      onClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
            {milestoneNumber}
          </div>
          Add {MILESTONE_LABELS[milestoneNumber - 1] || `Payment ${milestoneNumber}`}
        </DialogTitle>
        <DialogDescription>
          Total: {totalAmount.toLocaleString()} {currency} · {remainingPercent.toFixed(1)}% remaining ({remainingAmount.toLocaleString()} {currency})
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Toggle: percentage vs manual */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <Label htmlFor="input-mode" className="text-sm font-medium cursor-pointer">
            {usePercentage ? 'Enter as percentage of total' : 'Enter as fixed amount'}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{currency}</span>
            <Switch id="input-mode" checked={usePercentage} onCheckedChange={(v) => { setUsePercentage(v); setAmount(''); setPercentage(''); }} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        {usePercentage ? (
          <div className="space-y-2">
            <Label>Percentage of Total Amount</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingPercent}
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder={`Max ${remainingPercent.toFixed(1)}%`}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            {amount && (
              <p className="text-sm text-muted-foreground">
                = <span className="font-semibold text-foreground">{parseFloat(amount).toLocaleString()} {currency}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={`Max ${remainingAmount.toLocaleString()}`}
            />
            {percentage && (
              <p className="text-sm text-muted-foreground">
                = <span className="font-semibold text-foreground">{parseFloat(percentage).toFixed(2)}%</span> of total
              </p>
            )}
          </div>
        )}

        {/* Quick percentage buttons */}
        {usePercentage && (
          <div className="flex gap-2 flex-wrap">
            {[25, 30, 50].filter(v => v <= remainingPercent).map(v => (
              <Button
                key={v}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handlePercentageChange(String(v))}
              >
                {v}%
              </Button>
            ))}
            {remainingPercent > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handlePercentageChange(remainingPercent.toFixed(2))}
              >
                Remaining ({remainingPercent.toFixed(1)}%)
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Due / Payment Date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference #</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REF-001" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createPayment.isPending || !isValid}>
          {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Milestone
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
