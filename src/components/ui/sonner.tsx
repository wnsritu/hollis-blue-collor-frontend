import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border shadow-lg " +
            "bg-background text-foreground border-border " +
            "data-[type=success]:bg-green-600 data-[type=success]:text-white " +
            "data-[type=error]:bg-red-600 data-[type=error]:text-white " +
            "data-[type=info]:bg-blue-600 data-[type=info]:text-white",

          description: "text-muted-foreground",

          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
