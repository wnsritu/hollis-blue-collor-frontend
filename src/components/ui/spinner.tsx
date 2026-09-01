import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const Spinner = ({ size, className, ...props }: SpinnerProps) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
        !size && "h-6 w-6",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    />
  );
};

export default Spinner;

