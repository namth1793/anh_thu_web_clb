import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import api from '../utils/api';
import ClubCard from '../components/common/ClubCard';

const QUESTIONS = [
  {
    id: 'interests',
    question: 'Bạn đam mê lĩnh vực nào nhất?',
    icon: '🎯',
    options: [
      { label: '💻 Lập trình & Công nghệ', value: 'technology', points: { technology: 3, academic: 1 } },
      { label: '🎨 Thiết kế & Nghệ thuật', value: 'art', points: { art: 3, media: 2 } },
      { label: '📸 Truyền thông & Content', value: 'media', points: { media: 3, art: 1 } },
      { label: '📚 Học thuật & Ngôn ngữ', value: 'academic', points: { academic: 3 } },
      { label: '⚽ Thể thao & Vận động', value: 'sports', points: { sports: 3 } },
      { label: '❤️ Tình nguyện & Xã hội', value: 'community', points: { community: 3 } },
    ],
  },
  {
    id: 'goal',
    question: 'Mục tiêu chính của bạn khi tham gia CLB?',
    icon: '🚀',
    options: [
      { label: '🏆 Thi đua & Cạnh tranh', value: 'compete', points: { technology: 2, sports: 2 } },
      { label: '🤝 Kết bạn & Networking', value: 'network', points: { community: 2, academic: 2, media: 1 } },
      { label: '💡 Học kỹ năng mới', value: 'learn', points: { technology: 2, academic: 2, art: 1 } },
      { label: '🎉 Giải trí & Vui chơi', value: 'fun', points: { art: 2, sports: 2, media: 1 } },
      { label: '🌟 Phát triển sự nghiệp', value: 'career', points: { technology: 3, academic: 2, media: 2 } },
    ],
  },
  {
    id: 'skill',
    question: 'Bạn muốn phát triển kỹ năng gì?',
    icon: '⚡',
    options: [
      { label: '👨‍💻 Kỹ năng kỹ thuật', value: 'tech', points: { technology: 3 } },
      { label: '🗣️ Giao tiếp & Ngoại ngữ', value: 'comm', points: { academic: 3, media: 1 } },
      { label: '✍️ Sáng tạo & Thiết kế', value: 'creative', points: { art: 3, media: 2 } },
      { label: '🏃 Thể lực & Sức khỏe', value: 'physical', points: { sports: 3 } },
      { label: '💬 Leadership & Tổ chức', value: 'lead', points: { community: 2, academic: 2, technology: 1 } },
    ],
  },
  {
    id: 'time',
    question: 'Bạn có thể dành bao nhiêu thời gian mỗi tuần?',
    icon: '⏰',
    options: [
      { label: '🟢 1-2 giờ (nhẹ nhàng)', value: 'low', points: { community: 1, academic: 1 } },
      { label: '🟡 3-5 giờ (vừa phải)', value: 'medium', points: { art: 1, sports: 1, media: 1 } },
      { label: '🔴 6+ giờ (cống hiến hết mình)', value: 'high', points: { technology: 2, sports: 2 } },
    ],
  },
];

export default function Suggest() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ technology: 0, academic: 0, media: 0, art: 0, sports: 0, community: 0 });
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChoice = async (points) => {
    const newScores = { ...scores };
    Object.entries(points).forEach(([cat, pts]) => { newScores[cat] = (newScores[cat] || 0) + pts; });
    setScores(newScores);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Find top categories
      const sorted = Object.entries(newScores).sort((a, b) => b[1] - a[1]);
      const top = sorted.slice(0, 2).map(([cat]) => cat);
      setLoading(true);
      try {
        const results = await Promise.all(top.map((cat) => api.get(`/clubs?category=${cat}`)));
        const all = results.flatMap((r) => r.data);
        const unique = all.filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).slice(0, 6);
        setClubs(unique);
      } finally {
        setLoading(false);
        setDone(true);
      }
    }
  };

  const reset = () => {
    setStep(0);
    setScores({ technology: 0, academic: 0, media: 0, art: 0, sports: 0, community: 0 });
    setClubs([]);
    setDone(false);
  };

  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-800">Gợi ý CLB phù hợp</h1>
        <p className="text-slate-500 mt-2">Trả lời vài câu hỏi để tìm CLB phù hợp nhất với bạn</p>
      </div>

      {!done ? (
        <div className="card p-8">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Câu hỏi {step + 1}/{QUESTIONS.length}</span>
            <span>{Math.round((step / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="text-4xl mb-3 text-center">{QUESTIONS[step].icon}</div>
          <h2 className="text-xl font-bold text-slate-800 text-center mb-6">{QUESTIONS[step].question}</h2>

          <div className="space-y-3">
            {QUESTIONS[step].options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleChoice(opt.points)}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-medium text-slate-700 hover:text-indigo-700"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-ghost mt-4 text-sm">
              ← Câu trước
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-slate-800">CLB phù hợp với bạn!</h2>
            <p className="text-slate-500 mt-2">Dựa trên câu trả lời của bạn, chúng tôi gợi ý các CLB sau:</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => <div key={i} className="card h-52 animate-pulse bg-slate-200" />)}
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center text-slate-400 py-10">Không tìm thấy CLB phù hợp</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              {clubs.map((c) => <ClubCard key={c.id} club={c} />)}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={reset} className="btn-secondary">
              <RotateCcw size={16} /> Làm lại quiz
            </button>
            <Link to="/clubs" className="btn-primary">
              Xem tất cả CLB <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
