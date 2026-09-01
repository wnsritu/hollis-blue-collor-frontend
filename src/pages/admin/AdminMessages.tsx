import { MessageSquare } from "lucide-react";

const AdminMessages = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
          <MessageSquare size={28} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground">
          Messages Monitoring Coming Soon
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          We're working on message monitoring features. Soon you'll be able to
          view and manage all conversations here.
        </p>
      </div>
    </div>
  );
};

export default AdminMessages;
