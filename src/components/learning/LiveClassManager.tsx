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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Users,
  Video,
  Archive,
  Plus,
  Edit,
  Trash2,
  Play,
  Clock,
  DollarSign,
  UserCheck,
  BarChart,
  Download,
  Settings,
  Mic,
  Camera,
  Monitor,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LiveClass {
  id: string;
  title: string;
  description: string;
  class_type: string;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees: number;
  price_per_attendee: number;
  is_monetized: boolean;
  host_id: string;
  zoom_meeting_id?: string;
  zoom_password?: string;
  created_at: string;
}

interface ClassSession {
  id: string;
  class_id: string;
  session_date: string;
  actual_start_time?: string;
  actual_end_time?: string;
  recording_url?: string;
  session_notes?: string;
  attendance_count: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
}

interface ClassAttendee {
  id: string;
  class_id: string;
  attendee_id: string;
  registration_date: string;
  attendance_status: string;
  payment_amount: number;
}

export default function LiveClassManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendees, setAttendees] = useState<ClassAttendee[]>([]);
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const { toast } = useToast();

  const [newClass, setNewClass] = useState({
    title: "",
    description: "",
    class_type: "education",
    scheduled_at: "",
    duration_minutes: 60,
    max_attendees: 50,
    price_per_attendee: 0,
    is_monetized: false,
    zoom_meeting_id: "",
    zoom_password: "",
  });

  useEffect(() => {
    fetchUserClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSessions(selectedClass.id);
      fetchClassAttendees(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchUserClasses = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .eq("host_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
      return;
    }

    setClasses(data || []);
  };

  const fetchClassSessions = async (classId: string) => {
    const { data, error } = await supabase
      .from("class_sessions")
      .select("*")
      .eq("class_id", classId)
      .order("session_date", { ascending: false });

    if (data) setSessions(data as ClassSession[]);
  };

  const fetchClassAttendees = async (classId: string) => {
    const { data, error } = await supabase
      .from("class_attendees")
      .select("*")
      .eq("class_id", classId)
      .order("registration_date", { ascending: false });

    if (data) setAttendees(data);
  };

  const handleCreateClass = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a class",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("live_classes")
      .insert({
        ...newClass,
        host_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
      return;
    }

    // Create initial session
    await supabase.from("class_sessions").insert({
      class_id: data.id,
      session_date: newClass.scheduled_at,
      status: "scheduled",
    });

    toast({
      title: "Success",
      description: "Class created successfully",
    });

    setClasses([...classes, data]);
    setIsCreateModalOpen(false);
    setNewClass({
      title: "",
      description: "",
      class_type: "education",
      scheduled_at: "",
      duration_minutes: 60,
      max_attendees: 50,
      price_per_attendee: 0,
      is_monetized: false,
      zoom_meeting_id: "",
      zoom_password: "",
    });
  };

  const handleStartClass = async (classId: string) => {
    const session = sessions.find(
      (s) => s.class_id === classId && s.status === "scheduled",
    );
    if (!session) return;

    const { error } = await supabase
      .from("class_sessions")
      .update({
        status: "live",
        actual_start_time: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start class",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Class Started",
      description: "Your live class is now active",
    });

    fetchClassSessions(classId);
  };

  const handleEndClass = async (classId: string) => {
    const session = sessions.find(
      (s) => s.class_id === classId && s.status === "live",
    );
    if (!session) return;

    const { error } = await supabase
      .from("class_sessions")
      .update({
        status: "completed",
        actual_end_time: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to end class",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Class Ended",
      description: "Your live class has been completed",
    });

    fetchClassSessions(classId);
  };

  const handleJoinClass = (liveClass: LiveClass) => {
    if (liveClass.zoom_meeting_id) {
      const zoomUrl = `https://zoom.us/j/${liveClass.zoom_meeting_id}${liveClass.zoom_password ? `?pwd=${liveClass.zoom_password}` : ""}`;
      window.open(zoomUrl, "_blank");
    } else {
      toast({
        title: "No Meeting Link",
        description: "This class doesn't have a meeting link configured",
        variant: "destructive",
      });
    }
  };

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
    const classTime = new Date(liveClass.scheduled_at);
    const endTime = new Date(
      classTime.getTime() + liveClass.duration_minutes * 60000,
    );

    if (now < classTime) return "upcoming";
    if (now >= classTime && now <= endTime) return "live";
    return "completed";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "live":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredClasses = classes.filter((cls) => {
    const status = getClassStatus(cls);
    if (activeTab === "upcoming") return status === "upcoming";
    if (activeTab === "live") return status === "live";
    if (activeTab === "completed") return status === "completed";
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Class Manager</h1>
          <p className="text-muted-foreground">
            Schedule, manage, and host live educational sessions
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Live Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Class Title</Label>
                <Input
                  id="title"
                  value={newClass.title}
                  onChange={(e) =>
                    setNewClass({ ...newClass, title: e.target.value })
                  }
                  placeholder="e.g., Blockchain Fundamentals Workshop"
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
                  placeholder="Describe what students will learn..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="monetized"
                    checked={newClass.is_monetized}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        is_monetized: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="monetized">Monetized Class</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoom_id">Zoom Meeting ID (optional)</Label>
                  <Input
                    id="zoom_id"
                    value={newClass.zoom_meeting_id}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        zoom_meeting_id: e.target.value,
                      })
                    }
                    placeholder="123 456 7890"
                  />
                </div>
                <div>
                  <Label htmlFor="zoom_password">
                    Zoom Password (optional)
                  </Label>
                  <Input
                    id="zoom_password"
                    value={newClass.zoom_password}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        zoom_password: e.target.value,
                      })
                    }
                    placeholder="Meeting password"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateClass} className="flex-1">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Class
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            {filteredClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No upcoming classes scheduled. Create your first one!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <Card key={cls.id} className="relative">
                    <div className="absolute top-4 right-4">
                      <Badge className={getStatusColor(getClassStatus(cls))}>
                        {getClassStatus(cls)}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg pr-16">
                        {cls.title}
                      </CardTitle>
                      <Badge variant="outline">{cls.class_type}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {cls.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {format(new Date(cls.scheduled_at), "PPp")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{cls.duration_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Max {cls.max_attendees} attendees</span>
                        </div>
                        {cls.is_monetized && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>${cls.price_per_attendee}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartClass(cls.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="space-y-4">
            {filteredClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No live classes at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClasses.map((cls) => (
                  <Card key={cls.id} className="border-green-500 border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cls.title}</CardTitle>
                        <Badge className="bg-green-500 animate-pulse">
                          🔴 LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-muted rounded">
                            <p className="text-2xl font-bold">
                              {
                                attendees.filter((a) => a.class_id === cls.id)
                                  .length
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Attendees
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded">
                            <p className="text-2xl font-bold">
                              {cls.duration_minutes}m
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Duration
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleJoinClass(cls)}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Class
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEndClass(cls.id)}
                          >
                            End
                          </Button>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Mic className="h-4 w-4 mr-1" />
                            Audio
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Video
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Monitor className="h-4 w-4 mr-1" />
                            Screen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {filteredClasses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No completed classes yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <Card key={cls.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{cls.title}</CardTitle>
                      <Badge variant="outline">Completed</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>
                            {format(new Date(cls.scheduled_at), "PP")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendees:</span>
                          <span>
                            {
                              attendees.filter((a) => a.class_id === cls.id)
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{cls.duration_minutes} minutes</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <BarChart className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          Recording
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Class Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Classes for{" "}
                  {selectedDate
                    ? format(selectedDate, "PPPP")
                    : "Selected Date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Calendar integration coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
