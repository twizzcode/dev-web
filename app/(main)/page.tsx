"use client"
import SettingHomeComponents from "@/components/(main)/home-components/setting";
import HomeUpload from "@/components/(main)/home-components/upload";
import Result from "@/components/(main)/home-components/result";
import { useState } from "react";


export default function Home() {
  // Flow: Upload first -> once completed show settings with files
  const [uploadedFiles, setUploadedFiles] = useState<File[] | null>(null);
  const [cropped, setCropped] = useState<string[] | null>(null);
  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex flex-1 flex-col p-4 overflow-hidden">
        {uploadedFiles === null && cropped === null && (
          <HomeUpload onComplete={(files)=> setUploadedFiles(files)} />
        )}
        {uploadedFiles !== null && cropped === null && (
          <SettingHomeComponents
            files={uploadedFiles}
            onBack={() => setUploadedFiles(null)}
            onCropped={(imgs) => setCropped(imgs)}
          />
        )}
        {cropped !== null && (
          <Result
            images={cropped}
            onBack={() => { setCropped(null); }}
            onReset={() => { setCropped(null); setUploadedFiles(null); }}
          />
        )}
      </div>
    </div>
  );
}
