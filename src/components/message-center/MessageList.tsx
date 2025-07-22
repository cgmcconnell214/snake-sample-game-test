import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertCircle, 
  FileText, 
  User, 
  Shield, 
  MessageSquare, 
  ChevronRight,
  Paperclip
} from 'lucide-react';

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

interface MessageListProps {
  messages: Message[];
  onMessageSelect: (message: Message) => void;
  onMarkAsRead: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onMessageSelect, 
  onMarkAsRead 
}) => {
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system': return <AlertCircle className="h-4 w-4 text-primary" />;
      case 'report': return <FileText className="h-4 w-4 text-green-500" />;
      case 'compliance': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'user': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n?.[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Messages</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto max-h-[600px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No messages found</h3>
            <p className="text-muted-foreground text-sm">
              Your inbox is empty or no messages match your search criteria
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => {
              // Check if it has attachments
              const attachments = typeof message.attachments === 'string' 
                ? JSON.parse(message.attachments || '[]') 
                : message.attachments || [];
              
              const hasAttachments = attachments.length > 0;
              
              return (
                <div
                  key={message.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 relative ${
                    !message.is_read 
                      ? 'bg-primary/5 border-l-4 border-primary' 
                      : 'hover:shadow-sm border-l-4 border-transparent'
                  }`}
                  onClick={() => {
                    onMessageSelect(message);
                    if (!message.is_read) {
                      onMarkAsRead(message.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${!message.is_read ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10'}`}>
                        {message.sender_id ? getInitials(message.sender_profile?.first_name + ' ' + message.sender_profile?.last_name) : 'SYS'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${!message.is_read ? 'text-primary' : ''}`}>
                            {message.subject}
                          </span>
                          {!message.is_read && (
                            <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getMessageIcon(message.message_type)}
                            <span className="ml-1 hidden sm:inline">{message.message_type}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {message.content}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>
                            {message.sender_id 
                              ? `${message.sender_profile?.first_name || 'User'} ${message.sender_profile?.last_name || ''}`.trim() 
                              : 'System'}
                          </span>
                          {hasAttachments && (
                            <span className="flex items-center">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {attachments.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(message.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageList;