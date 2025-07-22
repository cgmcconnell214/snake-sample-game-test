import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComposeMessageProps {
  onMessageSent: () => void;
}

const ComposeMessage: React.FC<ComposeMessageProps> = ({ onMessageSent }) => {
  const [newMessage, setNewMessage] = useState({ subject: '', content: '', recipient: '' });
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!newMessage.recipient.trim() || !newMessage.content.trim()) return;

    setSending(true);
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
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
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
            disabled={sending}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subject</label>
          <Input
            placeholder="Enter message subject"
            value={newMessage.subject}
            onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
            disabled={sending}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Enter your message"
            value={newMessage.content}
            onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            disabled={sending}
          />
        </div>
        <Button 
          onClick={sendMessage}
          disabled={!newMessage.recipient || !newMessage.subject || !newMessage.content || sending}
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ComposeMessage;