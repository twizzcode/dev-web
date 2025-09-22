
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ChevronRight } from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ImageUpload } from "@/components/ui/image-upload";
import { BorderBeam } from "@/components/ui/border-beam";

interface HomeUploadProps {
  onComplete?: (files: File[]) => void;
}

const HomeUpload: React.FC<HomeUploadProps> = ({ onComplete }) => {
  interface UploadFileItem { file?: File; progress: number; failed?: boolean }
  const [files, setFiles] = React.useState<UploadFileItem[]>([]);

  // Call onComplete when all files present are completed (progress===100 and not failed)
  useEffect(() => {
    if (!onComplete) return;
    if (files.length === 0) return;
    const eligible = files.filter(f=>!f.failed);
    if (eligible.length > 0 && eligible.every(f=>f.progress >= 100)) {
      onComplete(eligible.map(f=>f.file!).filter(Boolean));
    }
  }, [files, onComplete]);
  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Inner content area with consistent padding like home */}
      <div className="relative flex flex-1 flex-col p-4 overflow-hidden">
        <div className="relative flex flex-1 flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Animated background */}
          <AnimatedGridPattern
            numSquares={50}
            maxOpacity={0.05}
            duration={1}
            className={cn(
              "pointer-events-none opacity-50 absolute inset-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
              "skew-y-12"
            )}
            />
          {/* Left Panel */}
          <div className="relative z-10 flex-1 rounded-lg p-4 flex flex-col justify-center overflow-hidden xl:pl-30 lg:items-center">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center md:items-start">
              <div className="group relative flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] mb-6">
                <span
                  className={cn(
                    "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
                  )}
                  style={{
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "destination-out",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "subtract",
                    WebkitClipPath: "padding-box",
                  }}
                />
                🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
                <AnimatedGradientText className="text-sm font-medium">
                  Welcome to Twizz Cutter!  
                </AnimatedGradientText>
                <ChevronRight
                  className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                />
              </div>

              <AuroraText className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
                twizzcutter.com
              </AuroraText>
              <p className="text-lg max-w-lg text-accent-foreground/80 font-semibold text-center md:text-start">
                The best platform to cut your images, The best platform to cut your images, The best platform to cut your images,
              </p>
              <RainbowButton className="mt-6 px-6 py-3 w-[200px] rounded-full">
                Get Started, Toturials!
              </RainbowButton>
            </div>
          </div>

          {/* Right Panel */}
          <div className="relative z-10 flex-1 rounded-lg p-4 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-md relative rounded-xl">
              {files.filter(f=>!f.failed).length === 0 && (
                <>
                  <BorderBeam
                    duration={6}
                    size={200}
                    className="from-transparent via-foreground to-transparent"
                  />
                  <BorderBeam
                    duration={6}
                    delay={3}
                    size={200}
                    borderWidth={2}
                    className="from-transparent via-foreground to-transparent"
                  />
                </>
              )}
              <ImageUpload onFilesChange={(f) => setFiles(f)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeUpload