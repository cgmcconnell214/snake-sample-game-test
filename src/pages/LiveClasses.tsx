import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Video, Archive } from "lucide-react"

export default function LiveClasses() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Classes & Calls</h1>
          <p className="text-muted-foreground">Join live educational sessions and workshops</p>
        </div>
        <Button>
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
            <Button variant="outline" className="w-full">View Calendar</Button>
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
            <Button variant="outline" className="w-full">Browse Events</Button>
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
            <Button variant="outline" className="w-full">View Archive</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}