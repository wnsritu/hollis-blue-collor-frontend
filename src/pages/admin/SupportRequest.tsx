import { FileText, Zap } from "lucide-react";

const SupportRequestsPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <FileText size={24} />
        </div>

        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap size={12} /> Support Feature
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground">
          Support Requests Coming Soon
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Review and manage refund or credit requests from support agents. This
          feature will be available soon.
        </p>
      </div>
    </div>
  );
};

export default SupportRequestsPage;
