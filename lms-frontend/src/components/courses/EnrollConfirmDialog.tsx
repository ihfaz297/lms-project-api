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
import { DollarSign } from 'lucide-react';

interface EnrollConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseName: string;
    coursePrice: number;
    balance: number | null;
    onConfirm: () => void;
    loading?: boolean;
}

/**
 * Payment confirmation dialog (G11).
 * Shows course price, user balance, and remaining balance before enrollment.
 */
const EnrollConfirmDialog: React.FC<EnrollConfirmDialogProps> = ({
    open,
    onOpenChange,
    courseName,
    coursePrice,
    balance,
    onConfirm,
    loading,
}) => {
    const remaining = balance !== null ? balance - coursePrice : null;
    const canAfford = remaining !== null && remaining >= 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Enrollment</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>You are about to enroll in <strong>{courseName}</strong>.</p>
                            <div className="rounded-lg border p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Course Price</span>
                                    <span className="flex items-center font-medium">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        {coursePrice.toFixed(2)}
                                    </span>
                                </div>
                                {balance !== null && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span>Your Balance</span>
                                            <span className="flex items-center font-medium">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                {balance.toFixed(2)}
                                            </span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span>Remaining</span>
                                            <span className={`flex items-center ${canAfford ? 'text-green-600' : 'text-destructive'}`}>
                                                <DollarSign className="h-3.5 w-3.5" />
                                                {remaining!.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {!canAfford && balance !== null && (
                                <p className="text-destructive text-sm font-medium">
                                    Insufficient balance. Please add funds to your bank account.
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                This will transfer funds from your bank account. After enrollment, the instructor must validate your payment before you can access course content.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={loading || !canAfford}>
                        {loading ? 'Processing...' : 'Confirm & Pay'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default EnrollConfirmDialog;
