import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ocean-50 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-ocean-900 mb-2">{title}</h3>
      <p className="text-sm text-ocean-600 mb-4 max-w-md text-center">{description}</p>
      {action}
    </div>
  );
} 