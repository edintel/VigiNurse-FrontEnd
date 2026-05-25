import { Suspense } from "react";
import ChatPage from "@/features/chat/components/ChatPage";

export default function ChatRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-md text-[#09268E]" /></div>}>
      <ChatPage />
    </Suspense>
  );
}
