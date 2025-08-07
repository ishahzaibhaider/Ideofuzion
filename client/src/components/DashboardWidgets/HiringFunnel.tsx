interface FunnelStage {
  name: string;
  count: number;
  color: string;
}

interface HiringFunnelProps {
  stages: FunnelStage[];
}

export default function HiringFunnel({ stages }: HiringFunnelProps) {
  const maxCount = Math.max(...stages.map(stage => stage.count));

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500 text-blue-500';
      case 'green':
        return 'bg-green-500 text-green-500';
      case 'yellow':
        return 'bg-yellow-500 text-yellow-500';
      case 'purple':
        return 'bg-purple-500 text-purple-500';
      case 'success':
        return 'bg-emerald-500 text-emerald-500';
      default:
        return 'bg-gray-500 text-gray-500';
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Hiring Funnel</h3>
            <p className="text-sm text-gray-600">Candidate progression through stages</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const colorClasses = getColorClasses(stage.color);
            
            return (
              <div key={index} className={`flex items-center justify-between p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-[1.02] ${
                stage.name === 'Hired' 
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-emerald-100 shadow-lg' 
                  : 'bg-white/40 border-gray-200/50 hover:bg-white/60'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colorClasses.split(' ')[0]}`}></div>
                  <span className={`font-medium ${
                    stage.name === 'Hired' ? 'text-emerald-900' : 'text-gray-900'
                  }`}>
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-2xl font-bold ${
                    stage.name === 'Hired' ? 'text-emerald-700' : 'text-gray-900'
                  }`}>
                    {stage.count}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colorClasses.split(' ')[0]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
