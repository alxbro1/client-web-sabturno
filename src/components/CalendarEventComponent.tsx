"use client";

import { format } from "date-fns";
import type { Appointment, Block } from "@/features/appointment-timeline/types";

interface CalendarEventComponentProps {
  event: {
    title: string;
    start?: Date;
    end?: Date;
    resource?: Appointment | Block;
    isBlock?: boolean;
  };
}

function isAppointment(
  resource: Appointment | Block | undefined
): resource is Appointment {
  return resource !== undefined && "status" in resource;
}

export function CalendarEventComponent({ event }: CalendarEventComponentProps) {
  const resource = event.resource;

  if (event.isBlock || !isAppointment(resource)) {
    return (
      <div className="flex flex-col gap-0.5 p-1 text-xs overflow-hidden">
        <span className="font-medium truncate">
          {event.title || "Bloqueado"}
        </span>
        {event.start && event.end && (
          <span className="truncate opacity-70">
            {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1 text-xs overflow-hidden">
      <span className="font-medium truncate">{event.title}</span>
      {resource.serviceName && (
        <span className="truncate opacity-70">{resource.serviceName}</span>
      )}
      {resource.customerName && (
        <span className="truncate opacity-50">{resource.customerName}</span>
      )}
    </div>
  );
}
