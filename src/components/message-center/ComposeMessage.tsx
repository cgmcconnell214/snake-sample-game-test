import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComposeMessageProps {
  onMessageSent: () => void;
}

const ComposeMessage: React.FC<ComposeMessageProps> = ({ onMessageSent }) => {
  const [newMessage, setNewMessage] = useState({ subject: '', content: '', recipient: '' });
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 5 - attachments.length); // Max 5 files
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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

      // Prepare attachments data (for now, just store file info)
      const attachmentData = attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // In a real implementation, you would upload to storage and store the URL
        url: URL.createObjectURL(file) // Temporary URL for demo
      }));

      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientData.user_id,
          subject: newMessage.subject || 'No Subject',
          content: newMessage.content,
          message_type: 'user',
          attachments: JSON.stringify(attachmentData)
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `Message sent to ${recipientData.username || recipientData.display_name}`,
      });

      setNewMessage({ recipient: '', subject: '', content: '' });
      setAttachments([]);
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

        {/* Attachments */}
        <div>
          <label className="text-sm font-medium mb-2 block">Attachments</label>
          <div className="space-y-3">
            {/* File Upload Button */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = '*/*';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    handleFileUpload(target.files);
                  };
                  input.click();
                }}
                disabled={sending || attachments.length >= 5}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files
              </Button>
              {attachments.length > 0 && (
                <Badge variant="secondary">
                  {attachments.length}/5 files
                </Badge>
              )}
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      disabled={sending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {attachments.length > 0 && `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached`}
          </div>
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.recipient || !newMessage.content || sending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComposeMessage;