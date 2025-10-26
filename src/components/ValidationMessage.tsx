import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  message?: string;
  type?: "error" | "success" | "info";
  className?: string;
}

export const ValidationMessage = ({ 
  message, 
  type = "error", 
  className 
}: ValidationMessageProps) => {
  if (!message) return null;

  const iconMap = {
    error: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const colorMap = {
    error: "text-red-500",
    success: "text-green-500", 
    info: "text-blue-500",
  };

  const Icon = iconMap[type];
  const colorClass = colorMap[type];

  return (
    <p className={cn(
      "text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200",
      colorClass,
      className
    )}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </p>
  );
};
