'use client';

import { useState } from 'react';

interface AvatarProps {
  size?: number;
  showName?: boolean;
  className?: string;
}

export const PROFILE_NAME = '아이두';
export const PROFILE_IMAGE = '/profile.png';

export default function Avatar({ size = 56, showName = false, className = '' }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-ballet-light via-amber-50 to-futsal-light flex-shrink-0 ring-2 ring-white shadow-sm"
        style={{ width: size, height: size }}
      >
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={PROFILE_IMAGE}
            alt={PROFILE_NAME}
            width={size}
            height={size}
            className="w-full h-full object-cover object-top scale-[1.4] origin-top"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <InitialAvatar size={size} />
        )}
      </div>
      {showName && (
        <p className="text-base font-semibold text-text-primary">{PROFILE_NAME}</p>
      )}
    </div>
  );
}

function InitialAvatar({ size }: { size: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <span
        className="absolute"
        style={{ fontSize: size * 0.38, top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}
      >
        🩰
      </span>
      <span
        className="absolute opacity-90"
        style={{ fontSize: size * 0.3, bottom: '12%', right: '12%' }}
      >
        ⚽
      </span>
    </div>
  );
}
