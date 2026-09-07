// client/src/components/CloudGuideModal.jsx
import React from 'react';
import { X, Cloud, Power, Laptop, CheckCircle, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CloudGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-borderLight rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-borderLight">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center">
              <Power className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sage-900">
                컴퓨터를 꺼도 24시간 알림을 받을 수 있나요?
              </h3>
              <p className="text-xs text-sage-500 mt-0.5">
                로컬 실행 방식과 24시간 상시 가동(클라우드) 안내
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs leading-relaxed text-sage-800">
          {/* Current Status Box */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <Laptop className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 mb-1">현재 상태: 내 컴퓨터(로컬)에서 작동 중</h4>
              <p className="text-amber-900">
                현재는 사용자분의 개인 컴퓨터 안에서 프로그램이 실행되고 있습니다. 따라서 <strong>컴퓨터를 끄거나 절전 모드로 들어가면 프로그램도 함께 멈추게 되어</strong> 새로운 예매 오픈을 감지할 수 없습니다.
              </p>
            </div>
          </div>

          <h4 className="font-bold text-sm text-sage-900 pt-2 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sage-600" />
            <span>컴퓨터를 끄고도 24시간 알림을 받는 3가지 방법</span>
          </h4>

          {/* Solution 1: Free Cloud Hosting (Recommended) */}
          <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sage-900 text-sm flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>1. 무료 클라우드 호스팅에 배포 (가장 추천)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                완전 무료
              </span>
            </div>
            <p className="text-sage-700">
              <strong>Render.com</strong>, <strong>Railway</strong>, 또는 <strong>Fly.io</strong> 같은 무료 클라우드 서비스에 이 프로젝트를 올려두면, 내 컴퓨터를 완전히 꺼두어도 클라우드 서버가 365일 24시간 동안 극장을 감시하고 디스코드 웹훅으로 알림을 보내줍니다.
            </p>
            <div className="pt-2 text-[11px] text-sage-600 bg-white p-3 rounded-lg border border-borderLight space-y-1">
              <p className="font-semibold text-sage-800">💡 즉시 배포할 수 있도록 프로젝트 내 설정 파일을 넣어두었습니다:</p>
              <p>• <strong>Dockerfile</strong> 및 <strong>render.yaml</strong>이 이미 준비되어 있습니다.</p>
              <p>• GitHub에 이 코드를 올린 후 Render.com에서 'New Web Service'로 연결만 하면 무료로 켜둘 수 있습니다.</p>
            </div>
          </div>

          {/* Solution 2: Windows Background Service */}
          <div className="p-4 rounded-xl bg-white border border-borderLight space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sage-900 text-sm">
                2. PC를 켜둘 때 백그라운드 서비스로 자동 실행
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                로컬 자동화
              </span>
            </div>
            <p className="text-sage-700">
              컴퓨터를 켤 때마다 매번 터미널을 열 필요 없이, 윈도우가 부팅되면 자동으로 백그라운드에서 실행되도록 <strong>작업 스케줄러</strong>나 <strong>PM2</strong>로 등록해 둘 수 있습니다. (컴퓨터가 켜져 있는 동안 항상 감시)
            </p>
          </div>

          {/* Solution 3: Mini PC / Raspberry Pi */}
          <div className="p-4 rounded-xl bg-white border border-borderLight space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sage-900 text-sm">
                3. 집에 있는 안 쓰는 구형 노트북이나 미니PC 활용
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                홈 서버
              </span>
            </div>
            <p className="text-sage-700">
              전력을 거의 먹지 않는 미니PC나 라즈베리파이, 구형 노트북에 켜두시면 메인 컴퓨터를 끄더라도 24시간 디스코드 알림을 받을 수 있습니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-borderLight flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition"
          >
            확인했습니다
          </button>
        </div>

      </div>
    </div>
  );
}
