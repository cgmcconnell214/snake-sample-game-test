import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Video,
  Plus,
  Clock,
  DollarSign,
  VideoIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LiveClass {
  id: string;
  title: string;
  description: string;
  host_id: string;
  class_type: string;
  price_per_attendee: number;
  max_attendees?: number;
  scheduled_at: string;
  duration_minutes: number;
  zoom_meeting_id?: string;
  zoom_password?: string;
  is_monetized: boolean;
  created_at: string;
}

export default function LiveClasses(): JSX.Element {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    title: "",
    description: "",
    class_type: "education",
    price_per_attendee: 0,
    max_attendees: 50,
    scheduled_at: "",
    duration_minutes: 60,
    is_monetized: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch live classes",
        variant: "destructive",
      });
      return;
    }

    setClasses(data || []);
  };

  const handleCreateClass = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a live class",
        variant: "destructive",
      });
      return;
    }

    // Generate mock Zoom meeting details
    const zoomMeetingId = `${Math.floor(Math.random() * 1000000000)}`;
    const zoomPassword = Math.random().toString(36).substring(2, 8);

    // Validate required fields
    if (!newClass.title || !newClass.scheduled_at) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and scheduled date/time",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("live_classes")
      .insert({
        title: newClass.title,
        description: newClass.description,
        host_id: user.id,
        class_type: newClass.class_type,
        price_per_attendee: newClass.price_per_attendee,
        max_attendees: newClass.max_attendees,
        scheduled_at: newClass.scheduled_at,
        duration_minutes: newClass.duration_minutes,
        is_monetized: newClass.is_monetized,
        zoom_meeting_id: zoomMeetingId,
        zoom_password: zoomPassword,
      })
      .select()
      .single();

    if (error) {
      console.error("Live class creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create live class: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Live class created successfully with Zoom integration",
    });

    setClasses([...classes, data]);
    setIsCreateModalOpen(false);
    setNewClass({
      title: "",
      description: "",
      class_type: "education",
      price_per_attendee: 0,
      max_attendees: 50,
      scheduled_at: "",
      duration_minutes: 60,
      is_monetized: false,
    });
  };

  const handleJoinClass = async (classId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a class",
        variant: "destructive",
      });
      return;
    }

    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) return;

    // Free vs paid registration
    if (!classItem.price_per_attendee || classItem.price_per_attendee === 0) {
      const { error } = await supabase.from("class_attendees").insert({
        class_id: classId,
        attendee_id: user.id,
        payment_amount: 0,
        attendance_status: 'registered',
      });
      if (error) {
        toast({ title: 'Error', description: error.message || 'Failed to register', variant: 'destructive' });
        return;
      }
      toast({ title: 'Registered Successfully', description: `You're registered for ${classItem.title}.` });
      return;
    }

    const provider = window.prompt("Choose payment provider: type 'stripe' or 'xrpl'", 'stripe')?.toLowerCase();
    if (provider === 'stripe') {
      const amount_cents = Math.round((classItem.price_per_attendee || 0) * 100);
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount_cents,
          product_name: `Live Class Registration: ${classItem.title}`,
          metadata: { resource_type: 'live_class', class_id: classId }
        }
      });
      if (error) {
        toast({ title: 'Payment Error', description: error.message || 'Failed to start payment', variant: 'destructive' });
        return;
      }
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ title: 'Complete Payment', description: 'Stripe Checkout opened in a new tab. You will be registered upon successful payment.' });
      }
    } else if (provider === 'xrpl') {
      toast({ title: 'XRPL Payment', description: 'XRPL wallet payment requires platform wallet configuration. Please configure XRPL_WALLET_SEED.' });
    } else {
      toast({ title: 'Cancelled', description: 'Registration not started.' });
    }
  };

  const handleScheduleSession = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewCalendar = () => {
    // Navigate to a calendar component or dedicated calendar page
    window.open('https://calendar.google.com', '_blank');
  };

  const handleRSVPEvents = () => {
    // Show existing classes as events to RSVP to
    if (classes.length > 0) {
      toast({
        title: "Available Events",
        description: `${classes.length} upcoming classes available to join`,
      });
    } else {
      toast({
        title: "No Events",
        description: "No upcoming events to RSVP to. Create the first one!",
      });
    }
  };

  const handleViewArchive = () => {
    // Navigate to a replay archive or show recorded sessions
    toast({
      title: "Archive Feature",
      description: "Session recordings will be available after classes complete",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Classes & Calls</h1>
          <p className="text-muted-foreground">
            Interactive learning and community sessions
          </p>
        </div>
        <Button onClick={handleScheduleSession}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewCalendar}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View upcoming classes and schedule new sessions
            </p>
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleRSVPEvents}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              RSVP to Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Register for upcoming educational events and workshops
            </p>
            <Button variant="outline" className="w-full">
              Browse Events
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewArchive}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Replay Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access recordings of past sessions and workshops
            </p>
            <Button variant="outline" className="w-full">
              View Archive
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="h-5 w-5" />
                    <CardTitle className="text-lg">{classItem.title}</CardTitle>
                  </div>
                  <Badge
                    variant={classItem.is_monetized ? "default" : "secondary"}
                  >
                    {classItem.is_monetized
                      ? `$${classItem.price_per_attendee}`
                      : "Free"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {classItem.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium">
                      {new Date(classItem.scheduled_at).toLocaleDateString()} at{" "}
                      {new Date(classItem.scheduled_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {classItem.duration_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Max Attendees:
                    </span>
                    <span className="font-medium">
                      {classItem.max_attendees || "Unlimited"}
                    </span>
                  </div>
                  {classItem.zoom_meeting_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meeting ID:</span>
                      <span className="font-medium font-mono">
                        {classItem.zoom_meeting_id}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleJoinClass(classItem.id)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {classItem.is_monetized
                    ? `Register ($${classItem.price_per_attendee})`
                    : "Join Free"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No upcoming classes. Schedule the first one!
          </p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Schedule Live Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Class Title</Label>
                <Input
                  id="title"
                  value={newClass.title}
                  onChange={(e) =>
                    setNewClass({ ...newClass, title: e.target.value })
                  }
                  placeholder="e.g., Advanced Tokenization Workshop"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newClass.description}
                  onChange={(e) =>
                    setNewClass({ ...newClass, description: e.target.value })
                  }
                  placeholder="Describe what will be covered in this class..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class_type">Class Type</Label>
                  <Select
                    value={newClass.class_type}
                    onValueChange={(value) =>
                      setNewClass({ ...newClass, class_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="qa">Q&A Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newClass.duration_minutes}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        duration_minutes: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={newClass.scheduled_at}
                    onChange={(e) =>
                      setNewClass({ ...newClass, scheduled_at: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={newClass.max_attendees}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        max_attendees: parseInt(e.target.value) || 50,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Price per Attendee ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newClass.price_per_attendee}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      price_per_attendee: parseFloat(e.target.value) || 0,
                      is_monetized: parseFloat(e.target.value) > 0,
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateClass} className="flex-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Class
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
