import { MessageSquare, Eye } from "lucide-react";

const AdminConversation = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <MessageSquare size={24} />
        </div>

        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Eye size={12} /> Monitoring
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground">
          Conversation Monitoring Coming Soon
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Admins will soon be able to view and monitor customer-provider
          conversations in real-time.
        </p>
      </div>
    </div>
  );
};

export default AdminConversation;
