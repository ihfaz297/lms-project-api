import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coursesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { FileUp, Loader2 } from 'lucide-react';

interface MaterialUploadDialogProps {
    courseId: string;
    onMaterialAdded: () => void;
}

const MaterialUploadDialog: React.FC<MaterialUploadDialogProps> = ({ courseId, onMaterialAdded }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        type: 'text' as 'video' | 'text' | 'audio' | 'mcq',
        content: '',
        order: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title || !form.type) {
            toast.error('Title and type are required');
            return;
        }

        setLoading(true);
        try {
            const result = await coursesAPI.addMaterial(courseId, {
                title: form.title,
                type: form.type,
                content: form.content || undefined,
                order: form.order ? parseInt(form.order) : undefined,
            });
            toast.success(result.message);
            if (result.payout) {
                toast.success(`Bonus: $${result.payout.amount} earned!`, {
                    description: 'Material upload bonus has been deposited to your account.',
                });
            }
            setForm({ title: '', type: 'text', content: '', order: '' });
            setOpen(false);
            onMaterialAdded();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add material');
        } finally {
            setLoading(false);
        }
    };

    const contentPlaceholder = {
        video: 'Paste video URL (e.g. https://youtube.com/watch?v=...)',
        text: 'Enter text content or paste a URL to a document',
        audio: 'Paste audio URL (e.g. https://soundcloud.com/...)',
        mcq: 'Enter MCQ question and options',
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileUp className="h-4 w-4 mr-2" />
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Course Material</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mat-title">Title</Label>
                        <Input
                            id="mat-title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Lecture 1: Introduction"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mat-type">Type</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="mcq">MCQ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mat-order">Order</Label>
                            <Input
                                id="mat-order"
                                type="number"
                                min="0"
                                value={form.order}
                                onChange={(e) => setForm({ ...form, order: e.target.value })}
                                placeholder="1"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mat-content">Content</Label>
                        <Input
                            id="mat-content"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            placeholder={contentPlaceholder[form.type]}
                        />
                        <p className="text-xs text-muted-foreground">
                            For videos and audio, paste a URL. For text content, type directly.
                        </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Material
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MaterialUploadDialog;
