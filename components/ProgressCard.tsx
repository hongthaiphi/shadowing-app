interface ProgressCardProps {
  icon: string;
  label: string;
  value: string | number;
  sublabel?: string;
  gradient: string;
}

export default function ProgressCard({ icon, label, value, sublabel, gradient }: ProgressCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${gradient} shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
