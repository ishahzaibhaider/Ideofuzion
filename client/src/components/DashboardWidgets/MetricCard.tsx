interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  changeType = 'positive' 
}: MetricCardProps) {
  const getTrendColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${getTrendColor()}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">from last month</span>
      </div>
    </div>
  );
}
