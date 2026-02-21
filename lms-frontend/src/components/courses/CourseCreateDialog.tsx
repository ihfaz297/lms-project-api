import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coursesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

interface CourseCreateDialogProps {
    onCourseCreated: () => void;
}

const CourseCreateDialog: React.FC<CourseCreateDialogProps> = ({ onCourseCreated }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        duration: '',
        level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        thumbnail: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title || !form.description || !form.price || !form.duration || !form.thumbnail) {
            toast.error('All fields are required');
            return;
        }

        const price = parseFloat(form.price);
        if (isNaN(price) || price < 0) {
            toast.error('Price must be a non-negative number');
            return;
        }

        setLoading(true);
        try {
            const result = await coursesAPI.create({
                title: form.title,
                description: form.description,
                price,
                duration: form.duration,
                level: form.level,
                thumbnail: form.thumbnail,
            });
            toast.success(result.message);
            if (result.payout) {
                toast.success(`Bonus: $${result.payout.amount} earned!`, {
                    description: 'Course creation bonus has been deposited to your account.',
                });
            }
            setForm({ title: '', description: '', price: '', duration: '', level: 'beginner', thumbnail: '' });
            setOpen(false);
            onCourseCreated();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Introduction to React"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="A brief description of the course"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="49.99"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                                id="duration"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                placeholder="e.g. 8 hours"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="level">Level</Label>
                            <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as typeof form.level })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">Thumbnail URL</Label>
                            <Input
                                id="thumbnail"
                                value={form.thumbnail}
                                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                                placeholder="https://..."
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Course
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CourseCreateDialog;
