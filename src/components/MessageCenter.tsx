import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Send, 
  Inbox, 
  Archive, 
  FileText, 
  User,
  Clock,
  AlertCircle,
  Shield,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState({ subject: '', content: '', recipient: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
        .from('user_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.recipient.trim() || !newMessage.content.trim()) return;

    try {
      // Look up recipient by username first, then by display_name as fallback
      const { data: recipientData, error: recipientError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name')
        .or(`username.eq.${newMessage.recipient.trim()},display_name.ilike.%${newMessage.recipient.trim()}%`)
        .limit(1)
        .single();

      if (recipientError || !recipientData) {
        toast({
          title: "User Not Found",
          description: "Could not find a user with that username or display name.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientData.user_id,
          subject: newMessage.subject || 'No Subject',
          content: newMessage.content,
          message_type: 'user'
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `Message sent to ${recipientData.username || recipientData.display_name}`,
      });

      setNewMessage({ recipient: '', subject: '', content: '' });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'report': return <FileText className="h-4 w-4 text-green-500" />;
      case 'compliance': return <Shield className="h-4 w-4 text-yellow-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredMessages = messages.filter(msg =>
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  if (loading) {
    return <div className="p-6">Loading messages...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Message Center</h1>
        <Badge variant="outline">
          <Mail className="w-4 h-4 mr-1" />
          {unreadCount} Unread
        </Badge>
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
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.is_read) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getMessageIcon(message.message_type)}
                           <span className="font-medium text-sm">
                             {message.sender_id ? 'User' : 'System'}
                           </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="font-medium text-sm">{message.subject}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{selectedMessage.subject}</h3>
                        <Badge variant="outline" className="text-xs">
                          {selectedMessage.message_type}
                        </Badge>
                      </div>
                       <div className="text-sm text-muted-foreground mb-4">
                         From: {selectedMessage.sender_id ? 'User' : 'System'} • {new Date(selectedMessage.created_at).toLocaleString()}
                       </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                    </div>
                    {(() => {
                      // Parse attachments from JSON if it's a string, or use as array if already parsed
                      const attachments = typeof selectedMessage.attachments === 'string' 
                        ? JSON.parse(selectedMessage.attachments || '[]') 
                        : selectedMessage.attachments || [];
                      return attachments.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Attachments</h4>
                          <div className="space-y-2">
                            {attachments.map((attachment: any, index: number) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{attachment.name}</span>
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Select a message to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose New Message</CardTitle>
              <CardDescription>Send a message to another user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient</label>
                <Input
                  placeholder="Enter username (e.g., @john.doe)"
                  value={newMessage.recipient}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Enter message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.recipient || !newMessage.subject || !newMessage.content}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageCenter;