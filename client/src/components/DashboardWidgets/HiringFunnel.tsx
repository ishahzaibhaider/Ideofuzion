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
        return 'bg-success text-success';
      default:
        return 'bg-gray-500 text-gray-500';
    }
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Hiring Funnel</h3>
        <p className="text-sm text-gray-600">Candidate progression through stages</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const colorClasses = getColorClasses(stage.color);
            
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colorClasses.split(' ')[0]}`}></div>
                  <span className="font-medium text-gray-900">{stage.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-900">{stage.count}</span>
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
