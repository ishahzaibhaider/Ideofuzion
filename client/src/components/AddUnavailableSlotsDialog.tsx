import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { authenticatedApiRequest } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function AddUnavailableSlotsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ startTime: "", endTime: "" }]);
  const { toast } = useToast();

  const createSlotMutation = useMutation({
    mutationFn: async (slotData: { date: string; startTime: string; endTime: string }) => {
      const response = await authenticatedApiRequest("POST", "/api/unavailable-slots", slotData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unavailable-slots"] });
      toast({
        title: "Success",
        description: "Unavailable slots added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add unavailable slots",
        variant: "destructive",
      });
    },
  });

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: "", endTime: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updated = timeSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setTimeSlots(updated);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const validSlots = timeSlots.filter(slot => slot.startTime && slot.endTime);
    if (validSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot",
        variant: "destructive",
      });
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      for (const slot of validSlots) {
        // Create datetime strings in Pakistan Standard Time (UTC+5)
        // Parse the time input and create PKT datetime strings
        const startDateTime = new Date(`${dateStr}T${slot.startTime}:00.000+05:00`).toISOString();
        const endDateTime = new Date(`${dateStr}T${slot.endTime}:00.000+05:00`).toISOString();
        
        await createSlotMutation.mutateAsync({
          date: dateStr,
          startTime: startDateTime,
          endTime: endDateTime,
        });
      }

      // Reset form
      setSelectedDate(undefined);
      setTimeSlots([{ startTime: "", endTime: "" }]);
      setOpen(false);
    } catch (error) {
      console.error("Error saving slots:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Add Unavailable Slots</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Unavailable Time Slots</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Time Slots</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeSlot}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Slot
              </Button>
            </div>
            
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                    placeholder="Start time"
                  />
                </div>
                <span className="text-sm text-gray-500">to</span>
                <div className="flex-1">
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                    placeholder="End time"
                  />
                </div>
                {timeSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createSlotMutation.isPending}
            >
              {createSlotMutation.isPending ? "Saving..." : "Save Slots"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}