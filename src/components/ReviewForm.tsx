import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ThumbsUp, MessageSquare, Lightbulb, AlertCircle } from "lucide-react";
import { ReviewData, ReviewService } from "@/services/reviewService";
import { toast } from "sonner";

interface ReviewFormProps {
  ticketId: string;
  reviewerId: string;
  onReviewSubmitted: (review: any) => void;
  onCancel: () => void;
  initialData?: Partial<ReviewData>;
}

export const ReviewForm = ({ 
  ticketId, 
  reviewerId, 
  onReviewSubmitted, 
  onCancel,
  initialData 
}: ReviewFormProps) => {
  const [formData, setFormData] = useState<ReviewData>({
    ticketId,
    reviewerId,
    overallRating: initialData?.overallRating || 0,
    qualityRating: initialData?.qualityRating || 0,
    completenessRating: initialData?.completenessRating || 0,
    clarityRating: initialData?.clarityRating || 0,
    helpfulnessRating: initialData?.helpfulnessRating || 0,
    feedback: initialData?.feedback || "",
    suggestions: initialData?.suggestions || "",
    isAnonymous: initialData?.isAnonymous || false,
    metadata: initialData?.metadata || {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (criteria: keyof ReviewData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [criteria]: value
    }));
  };

  const handleTextChange = (field: keyof ReviewData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.overallRating === 0) {
      toast.error("Vui lòng chọn đánh giá tổng thể");
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await ReviewService.createReview(formData);
      toast.success("Đánh giá đã được gửi thành công!");
      onReviewSubmitted(review);
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSection = ({ 
    title, 
    description, 
    value, 
    onChange, 
    icon: Icon 
  }: {
    title: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <Label className="text-base font-medium">{title}</Label>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <RadioGroup
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
        className="flex gap-4"
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <RadioGroupItem value={rating.toString()} id={`${title}-${rating}`} />
            <Label htmlFor={`${title}-${rating}`} className="flex items-center gap-1">
              <Star className={`h-4 w-4 ${value >= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
              <span className="text-sm">{rating}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Đánh giá Ticket
        </CardTitle>
        <CardDescription>
          Đánh giá chất lượng và tính hữu ích của ticket này
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <RatingSection
            title="Đánh giá tổng thể"
            description="Đánh giá tổng quan về ticket này"
            value={formData.overallRating}
            onChange={(value) => handleRatingChange('overallRating', value)}
            icon={Star}
          />

          {/* Quality Rating */}
          <RatingSection
            title="Chất lượng nội dung"
            description="Ticket có được viết rõ ràng và chi tiết không?"
            value={formData.qualityRating || 0}
            onChange={(value) => handleRatingChange('qualityRating', value)}
            icon={ThumbsUp}
          />

          {/* Completeness Rating */}
          <RatingSection
            title="Tính đầy đủ"
            description="Ticket có cung cấp đủ thông tin cần thiết không?"
            value={formData.completenessRating || 0}
            onChange={(value) => handleRatingChange('completenessRating', value)}
            icon={AlertCircle}
          />

          {/* Clarity Rating */}
          <RatingSection
            title="Tính rõ ràng"
            description="Vấn đề được mô tả có dễ hiểu không?"
            value={formData.clarityRating || 0}
            onChange={(value) => handleRatingChange('clarityRating', value)}
            icon={MessageSquare}
          />

          {/* Helpfulness Rating */}
          <RatingSection
            title="Tính hữu ích"
            description="Ticket có giúp ích cho việc giải quyết vấn đề không?"
            value={formData.helpfulnessRating || 0}
            onChange={(value) => handleRatingChange('helpfulnessRating', value)}
            icon={Lightbulb}
          />

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Nhận xét chi tiết</Label>
            <Textarea
              id="feedback"
              placeholder="Chia sẻ nhận xét chi tiết về ticket này..."
              value={formData.feedback}
              onChange={(e) => handleTextChange('feedback', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label htmlFor="suggestions">Gợi ý cải thiện</Label>
            <Textarea
              id="suggestions"
              placeholder="Đưa ra gợi ý để cải thiện ticket trong tương lai..."
              value={formData.suggestions}
              onChange={(e) => handleTextChange('suggestions', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isAnonymous: checked as boolean }))
              }
            />
            <Label htmlFor="anonymous" className="text-sm">
              Đánh giá ẩn danh
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || formData.overallRating === 0}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
