import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { authenticatedApiRequest } from "@/lib/auth";

type BusySlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: Date;
};

export default function BusySlotsDisplay() {
  const { data: busySlots = [], isLoading } = useQuery<BusySlot[]>({
    queryKey: ["/api/busy-slots"],
    queryFn: async () => {
      const response = await authenticatedApiRequest("GET", "/api/busy-slots");
      return response.json();
    },
  });

  const formatTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, "h:mm a");
    } catch {
      return isoString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const upcomingBusySlots = busySlots.filter(slot => {
    const slotDate = parseISO(slot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return slotDate >= today;
  }).slice(0, 3);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg font-bold text-orange-900">Busy Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-orange-200 rounded w-3/4"></div>
            <div className="h-4 bg-orange-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg font-bold text-orange-900">Busy Schedule</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-orange-200 text-orange-800 hover:bg-orange-300">
            {busySlots.length} slots
          </Badge>
        </div>
        <CardDescription className="text-orange-700">
          {upcomingBusySlots.length > 0 ? "Upcoming busy time slots" : "No upcoming busy slots"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingBusySlots.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-12 w-12 text-orange-300 mx-auto mb-2" />
            <p className="text-orange-600 text-sm">No busy slots scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBusySlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white/50 rounded-lg p-3 border border-orange-200 hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        {formatDate(slot.date)}
                      </p>
                      <p className="text-xs text-orange-700">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {slot.reason || "Busy"}
                  </Badge>
                </div>
              </div>
            ))}
            {busySlots.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-xs text-orange-600">
                  +{busySlots.length - 3} more busy slots
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}