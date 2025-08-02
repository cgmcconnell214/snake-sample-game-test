import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Video, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LiveClasses(): JSX.Element {
  const { toast } = useToast();

  const handleScheduleSession = () => {
    toast({
      title: "Schedule Session",
      description: "Opening session scheduling interface",
    });
  };

  const handleViewCalendar = () => {
    toast({
      title: "Class Calendar",
      description: "Loading upcoming classes and workshops",
    });
  };

  const handleBrowseEvents = () => {
    toast({
      title: "Browse Events",
      description: "Showing available events for RSVP",
    });
  };

  const handleViewArchive = () => {
    toast({
      title: "Replay Archive",
      description: "Accessing past session recordings",
    });
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Classes & Calls</h1>
          <p className="text-muted-foreground">
            Join live educational sessions and workshops
          </p>
        </div>
        <Button onClick={handleScheduleSession}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View upcoming classes and workshops
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewCalendar}>
              View Calendar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              RSVP to Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Register for live sessions and get reminders
            </p>
            <Button variant="outline" className="w-full" onClick={handleBrowseEvents}>
              Browse Events
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Replay Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access recordings of past sessions
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewArchive}>
              View Archive
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
