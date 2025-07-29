import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply, Forward, Archive, Star, Clock } from 'lucide-react';
import AttachmentViewer, { type Attachment } from './AttachmentViewer';

interface Attachment {
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

interface Attachment {
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

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
 xgqza0-codex/replace-instances-of-any-with-correct-types
  attachments: Attachment[] | string | null;

 codex/replace-all-instances-of-any-in-codebase
  attachments: Attachment[] | string | null;

 codex/replace-any-with-correct-typescript-types
  attachments: Attachment[] | string;

 codex/replace-instances-of-any-with-correct-types
  attachments: string | Record<string, unknown>[] | null;

  attachments: Attachment[];
 main
 main
 main
 main
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MessageDetailProps {
  message: Message | null;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSenderInfo = () => {
    if (!message?.sender_id) return { name: 'System', initials: 'SYS' };
    if (message.sender_profile) {
      const name = `${message.sender_profile.first_name} ${message.sender_profile.last_name}`.trim();
      return { name: name || 'User', initials: getInitials(name || 'User') };
    }
    return { name: 'User', initials: 'U' };
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Message Details</CardTitle>
          {message && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant={message.message_type === 'system' ? 'default' : 'outline'} 
                className="text-xs"
              >
                {message.message_type}
              </Badge>
              {!message.is_read && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {message ? (
          <div className="space-y-6">
            {/* Message Header */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getSenderInfo().initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{message.subject}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <span>From: {getSenderInfo().name}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="prose prose-sm max-w-none">
              <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/20">
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {(() => {
              const attachments = typeof message.attachments === 'string' 
                ? JSON.parse(message.attachments || '[]') 
                : message.attachments || [];
              
              return attachments.length > 0 && (
                <AttachmentViewer attachments={attachments} />
              );
            })()}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline" size="sm">
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Star
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Reply className="h-8 w-8" />
            </div>
            <h3 className="font-medium mb-2">No Message Selected</h3>
            <p className="text-sm">Select a message from the list to view its details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageDetail;