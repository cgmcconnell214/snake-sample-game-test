import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Inbox, Archive, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./message-center/MessageList";
import MessageDetail from "./message-center/MessageDetail";
import ComposeMessage from "./message-center/ComposeMessage";
import ProfileBanner from "./message-center/ProfileBanner";
import MessageSearch from "./message-center/MessageSearch";

interface Attachment {
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  attachments: any;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}

const MessageCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, { name?: string; at: number }>>({});

  useEffect(() => {
    if (!user) return;

    // Presence channel to track who is online
    const presenceChannel: any = supabase.channel("message-presence", {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as Record<string, any[]>;
        const ids = new Set(Object.keys(state));
        setOnlineUserIds(ids);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    // Typing indicator channel
    const typingChannel: any = supabase
      .channel("message-typing")
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        setTypingUsers((prev) => ({
          ...prev,
          [payload.from]: { name: payload.fromName, at: Date.now() },
        }));
        // Auto-clear after 3s
        setTimeout(() => {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[payload.from];
            return copy;
          });
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("recipient_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg,
        ),
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Banner */}
      <ProfileBanner user={user} profile={profile} unreadCount={unreadCount} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Message Center</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <Mail className="w-4 h-4 mr-1" />
            {unreadCount} Unread
          </Badge>
          {Object.keys(typingUsers).length > 0 && (
            <Badge variant="secondary" className="text-xs">Someone is typing…</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList>
          <TabsTrigger value="inbox">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <MessageSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalMessages={messages.length}
            filteredCount={filteredMessages.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MessageList
              messages={filteredMessages}
              onMessageSelect={setSelectedMessage}
              onMarkAsRead={markAsRead}
              onlineUserIds={onlineUserIds}
            />
            <MessageDetail message={selectedMessage} />
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <ComposeMessage onMessageSent={fetchMessages} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageCenter;
