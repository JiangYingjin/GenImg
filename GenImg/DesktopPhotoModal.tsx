import { Modal, ModalContent, ModalBody, Button } from "@nextui-org/react"
import { Copy } from 'lucide-react'
import { PhotoType } from './types'

interface DesktopPhotoModalProps {
  selectedPhoto: PhotoType
  setSelectedPhoto: (photo: PhotoType | null) => void
  handleCopySettings: (photo: PhotoType) => void
  toast: {
    success: (message: string) => void
  }
}

export default function DesktopPhotoModal({
  selectedPhoto,
  setSelectedPhoto,
  handleCopySettings,
  toast,
}: DesktopPhotoModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={() => setSelectedPhoto(null)}
      size="full"
      hideCloseButton
      classNames={{
        wrapper: "p-0",
        base: "bg-black/95 h-screen w-screen m-0",
        body: "p-0 h-screen",
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="flex h-screen relative">
            <Button
              isIconOnly
              color="default"
              variant="light"
              onPress={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>

            <div className="flex-1 relative" onClick={() => setSelectedPhoto(null)}>
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.prompt || ''}
                className="w-full h-full object-contain p-4"
              />
            </div>

            <div className="w-[400px] bg-content1 h-full overflow-y-auto">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">提示词</h3>
                  <p className="text-default-600">{selectedPhoto.prompt}</p>
                </div>
                {selectedPhoto.negativePrompt && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">负面提示词</h3>
                    <p className="text-default-600">{selectedPhoto.negativePrompt}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold mb-2">图片信息</h3>
                  <div className="space-y-2 text-sm text-default-600">
                    <p>尺寸: {selectedPhoto.width} × {selectedPhoto.height} px</p>
                    <p>生成时间: {new Date(selectedPhoto.createdAt || '').toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  color="primary"
                  variant="shadow"
                  onPress={() => {
                    handleCopySettings(selectedPhoto)
                    setSelectedPhoto(null)
                    toast.success('已填入配置')
                  }}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  填入该配置
                </Button>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
} 