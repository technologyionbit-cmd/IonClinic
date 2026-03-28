import { MoonLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-white">
      <MoonLoader
        color="#000340"
        size={48}
        speedMultiplier={0.8}
      />
    </div>
  );
}