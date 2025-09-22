"use client";
import React from 'react';
import ReelsSettings from '@/components/(main)/reels/reels-settings';

const Reelspage: React.FC = () => {
  const [image, setImage] = React.useState<string>('');

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-80px)] overflow-hidden p-4">
      <ReelsSettings image={image} onReset={()=>setImage('')} onChangeImage={setImage} />
    </div>
  );
};

export default Reelspage;
