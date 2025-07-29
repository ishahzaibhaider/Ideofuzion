import { Link } from "wouter";

interface Interview {
  id: number;
  candidateName: string;
  position: string;
  time: string;
  date: string;
  calendarLink?: string;
}

interface UpcomingInterviewsProps {
  interviews: Interview[];
}

export default function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h3>
        <p className="text-sm text-gray-600">Next 7 days</p>
      </div>
      <div className="p-6 space-y-4">
        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No upcoming interviews scheduled</p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {interview.candidateName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{interview.candidateName}</p>
                  <p className="text-sm text-gray-500">{interview.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{interview.time}</p>
                <p className="text-sm text-gray-500">{interview.date}</p>
                {interview.calendarLink && (
                  <a 
                    href={interview.calendarLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Open Calendar
                  </a>
                )}
              </div>
            </div>
          ))
        )}
        
        {interviews.length > 0 && (
          <Link href="/candidates?filter=Interview Scheduled" className="block w-full text-center py-2 text-primary hover:text-primary/80 text-sm font-medium border-t border-gray-200 mt-4 pt-4">
            View All Interviews
          </Link>
        )}
      </div>
    </div>
  );
}
