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
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Upcoming Interviews</h3>
            <p className="text-sm text-gray-600">Next 7 days</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No upcoming interviews scheduled</p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="flex items-center justify-between p-4 bg-white/40 border border-gray-200/50 rounded-xl hover:bg-white/60 hover:shadow-lg transition-all duration-200 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-white">
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
          <Link href="/candidates?filter=Interview Scheduled" className="block w-full text-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 text-sm font-medium border-t border-gray-200/50 mt-4 pt-4 rounded-b-2xl transition-all duration-200">
            View All Interviews →
          </Link>
        )}
      </div>
    </div>
  );
}
