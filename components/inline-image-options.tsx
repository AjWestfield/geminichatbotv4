import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InlineImageOptionsProps {
  isVisible: boolean
  onOptionSelect: (option: 'analyze' | 'edit' | 'animate') => void
}

export function InlineImageOptions({ isVisible, onOptionSelect }: InlineImageOptionsProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="mb-3 p-1.5 bg-[#3C3C3C] border border-[#444444] rounded-md shadow-lg"
        >
          <TooltipProvider>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOptionSelect('analyze')}
                    className="flex-1 h-8 px-2 bg-[#2B2B2B] hover:bg-[#333333] text-white text-sm"
                  >
                    <span className="text-base mr-1">🔍</span>
                    <span className="hidden sm:inline">Analyze</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Analyze image content</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOptionSelect('edit')}
                    className="flex-1 h-8 px-2 bg-[#2B2B2B] hover:bg-[#333333] text-white text-sm"
                  >
                    <span className="text-base mr-1">✏️</span>
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit with AI</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOptionSelect('animate')}
                    className="flex-1 h-8 px-2 bg-[#2B2B2B] hover:bg-[#333333] text-white text-sm"
                  >
                    <span className="text-base mr-1">🎬</span>
                    <span className="hidden sm:inline">Animate</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create video</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  )
}