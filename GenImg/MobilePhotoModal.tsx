import { Modal, ModalContent, ModalBody, Button } from "@nextui-org/react"
import { Copy, ArrowUp } from 'lucide-react'
import { useEffect, useState } from "react"
import { PhotoType } from './types'

interface MobilePhotoModalProps {
  selectedPhoto: PhotoType | null
  isWideScreen: boolean
  setSelectedPhoto: (photo: PhotoType | null) => void
  handleCopySettings: (photo: PhotoType) => void
  toast: {
    success: (message: string) => void
  }
}

export default function MobilePhotoModal({
  selectedPhoto,
  isWideScreen,
  setSelectedPhoto,
  handleCopySettings,
  toast,
}: MobilePhotoModalProps) {
  // 动态设置 --vh
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty("--vh", `${vh}px`)
    }

    setVh()
    window.addEventListener("resize", setVh)
    return () => window.removeEventListener("resize", setVh)
  }, [])

  // 添加灯箱状态
  const [showLightbox, setShowLightbox] = useState(false)

  // 关闭灯箱的函数
  const closeLightbox = () => {
    setShowLightbox(false)
    // 使用 forward() 来避免创建新的历史记录
    window.history.forward()
  }

  // 关闭 Modal 的函数
  const closeModal = () => {
    setSelectedPhoto(null)
    window.history.forward()
  }

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()

      if (showLightbox) {
        closeLightbox()
        return
      }

      if (selectedPhoto) {
        closeModal()
        return
      }
    }

    // 当打开灯箱或 Modal 时添加历史记录
    if (showLightbox || selectedPhoto) {
      window.history.pushState(null, '', '')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [showLightbox, selectedPhoto])

  // 添加节流函数和状态
  const [lastScrollTime, setLastScrollTime] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(50)

  return (
    <>
      <Modal
        isOpen={!!selectedPhoto && !isWideScreen}
        onClose={closeModal}
        size="full"
        hideCloseButton
        classNames={{
          wrapper: "p-0",
          base: "bg-background h-[calc(var(--vh,1vh)*100)] w-screen m-0",
          body: "p-0 h-[calc(var(--vh,1vh)*100)] flex flex-col",
        }}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onTouchStart={(e) => e.preventDefault()}
      >
        <ModalContent>
          <ModalBody>
            <div
              className="relative flex-none max-h-[50vh]"
              id="mobile-photo-modal-image"
              onClick={() => setShowLightbox(true)}
            >
              <div className="w-full h-full relative">
                <img
                  src={selectedPhoto?.src}
                  alt={selectedPhoto?.prompt || ""}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto bg-background"
              onClick={() => setSelectedPhoto(null)}
              onScroll={(e) => {
                const now = Date.now()
                if (now - lastScrollTime < 16) { // 约60fps的频率
                  return
                }
                setLastScrollTime(now)

                const target = e.currentTarget
                const scrollTop = target.scrollTop
                const scrollHeight = target.scrollHeight
                const clientHeight = target.clientHeight
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 50

                const minHeight = 35
                const maxHeight = 50
                const maxScroll = 100 // 固定滚动距离

                // 使用更平滑的计算方式
                let targetHeight
                if (isNearBottom) {
                  targetHeight = minHeight
                } else {
                  targetHeight = Math.max(
                    minHeight,
                    maxHeight - (scrollTop / maxScroll) * (maxHeight - minHeight)
                  )
                }

                // 平滑过渡
                const newHeight = currentHeight + (targetHeight - currentHeight) * 0.3
                setCurrentHeight(newHeight)

                const imageContainer = document.querySelector('#mobile-photo-modal-image') as HTMLDivElement
                if (imageContainer) {
                  imageContainer.style.height = `${newHeight}vh`
                  imageContainer.style.transition = 'height 0.1s ease-out'
                }
              }}
            >
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">提示词</h3>
                  <p className="text-default-600">{selectedPhoto?.prompt}</p>
                </div>

                {selectedPhoto?.negativePrompt && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">负面提示词</h3>
                    <p className="text-default-600">{selectedPhoto.negativePrompt}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">图像信息</h3>
                  <div className="space-y-2 text-sm text-default-600">
                    <p>尺寸: {selectedPhoto?.width} × {selectedPhoto?.height} px</p>
                    <p>生成时间: {new Date(selectedPhoto?.createdAt || "").toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  color="primary"
                  variant="shadow"
                  onPress={() => {
                    selectedPhoto && handleCopySettings(selectedPhoto)
                    setSelectedPhoto(null)
                    toast.success("已填入配置")
                  }}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  填入该配置
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 添加灯箱 Modal */}
      <Modal
        isOpen={showLightbox}
        onClose={closeLightbox}
        size="full"
        hideCloseButton
        classNames={{
          wrapper: "p-0 fixed inset-0 z-[200]", // 增加 z-index 确保在最上层
          base: "bg-black h-screen w-screen m-0 touch-none", // 添加 touch-none 阻止触摸事件传递
          body: "p-0 h-screen flex items-center justify-center", // 添加 flex 布局使内容居中
        }}
      >
        <ModalContent>
          <ModalBody>
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={closeLightbox}
              onTouchStart={(e) => {
                e.preventDefault(); // 阻止所有触摸事件
              }}
            >
              <img
                src={selectedPhoto?.src}
                alt={selectedPhoto?.prompt || ""}
                className="max-w-full max-h-full object-contain select-none" // 添加 select-none 防止长按选择
              />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
} 