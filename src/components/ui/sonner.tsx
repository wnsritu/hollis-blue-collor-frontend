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
            "group toast border shadow-md rounded-2xl p-4 font-sans " +
            "data-[type=success]:bg-[#edfdf2] data-[type=success]:text-[#15803d] data-[type=success]:border-[#bbf7d0] " +
            "data-[type=error]:bg-[#fff1f2] data-[type=error]:text-[#9f1239] data-[type=error]:border-[#fecdd3] " +
            "data-[type=info]:bg-[#eff6ff] data-[type=info]:text-[#1e40af] data-[type=info]:border-[#bfdbfe]",
          title: "font-semibold text-sm leading-snug",
          description:
            "font-normal text-xs mt-0.5 opacity-90 " +
            "group-data-[type=success]:text-emerald-700 " +
            "group-data-[type=error]:text-rose-700 " +
            "group-data-[type=info]:text-blue-700",
          actionButton: "bg-primary text-primary-foreground font-medium rounded-lg text-xs px-3 py-1.5",
          cancelButton: "bg-muted text-muted-foreground font-medium rounded-lg text-xs px-3 py-1.5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
