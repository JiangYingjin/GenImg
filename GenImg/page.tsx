'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Textarea, Slider } from '@nextui-org/react'
import { Save, Trash2, Copy, Settings } from 'lucide-react'
import { Modal, ModalContent, ModalBody } from "@nextui-org/react"
import { toast } from 'react-toastify'
import MyPhotoAlbum from './MyPhotoAlbum'
import { PhotoType, SavedConfig } from './types'
import { useRouter } from "next/navigation"
import DesktopPhotoModal from './DesktopPhotoModal'
import MobilePhotoModal from './MobilePhotoModal'

export default function GenImg() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [width, setWidth] = useState(1440)
  const [height, setHeight] = useState(1080)
  const [photos, setPhotos] = useState<PhotoType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoType | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [aspectLocked, setAspectLocked] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(0)
  const [isVertical, setIsVertical] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(false)

  useEffect(() => {
    const wideScreenWidth = 1024
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= wideScreenWidth)
    }

    // 初始化
    handleResize()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      const savedPhotos = localStorage.getItem('genimg-photos')
      if (savedPhotos) {
        setPhotos(JSON.parse(savedPhotos))
      } else {
        try {
          const response = await fetch('/api/GenImg/examples')
          if (!response.ok) throw new Error('加载示例失败')
          const examples = await response.json()

          // 转换数据格式
          const formattedPhotos = examples.map((photo: any) => ({
            ...photo,
            src: `https://s.jyj.cx/proj/GenImg/${photo.filename}`,
          }))

          setPhotos(formattedPhotos)
          localStorage.setItem('genimg-photos', JSON.stringify(formattedPhotos))
        } catch (error) {
          console.error('加载示例图片失败:', error)
        }
      }

      // 加载配置
      const savedConfig = localStorage.getItem('genimg-config')
      if (savedConfig) {
        const config: SavedConfig = JSON.parse(savedConfig)
        setPrompt(config.prompt)
        setNegativePrompt(config.negativePrompt)
        setWidth(config.width)
        setHeight(config.height)
        setAspectLocked(config.aspectLocked ?? false)
        setIsVertical(config.isVertical ?? false)
        // 如果宽高比被锁定，计算并设置比例
        if (config.aspectLocked) {
          setAspectRatio(config.width / config.height)
        }
      } else {
        // 如果没有保存的配置，使用默认值
        setWidth(1440)
        setHeight(1080)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const config: SavedConfig = {
      prompt,
      negativePrompt,
      width,
      height,
      aspectLocked,
      isVertical
    }
    localStorage.setItem('genimg-config', JSON.stringify(config))
  }, [prompt, negativePrompt, width, height, aspectLocked, isVertical])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const promptValue = prompt.trim()
    if (!promptValue) {
      toast.error('请输入提示词')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/GenImg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptValue,
          negativePrompt,
          width,
          height,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '生成失败')
      }

      const newPhoto = {
        ...data,
        src: `https://s.jyj.cx/proj/GenImg/${data.filename}`,
        createdAt: new Date().toISOString(),
      }

      setPhotos(prev => [newPhoto, ...prev])
      localStorage.setItem('genimg-photos', JSON.stringify([newPhoto, ...photos]))
      toast.success('图像生成成功')
    } catch (error) {
      console.error('生成失败:', error)
      toast.error(error instanceof Error ? error.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: number) => {
    const updatedPhotos = photos.filter(p => p.id !== id)
    setPhotos(updatedPhotos)
    localStorage.setItem('genimg-photos', JSON.stringify(updatedPhotos))
    setDeleteId(null)
  }

  const handleCopySettings = (photo: PhotoType) => {
    setPrompt(photo.prompt)
    setNegativePrompt(photo.negativePrompt || '')
    setWidth(photo.width)
    setHeight(photo.height)
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  const handleSaveImage = async (filename: string) => {
    if (!filename) {
      toast.error('无效的文件名');
      return;
    }

    try {
      const response = await fetch(`https://s.jyj.cx/proj/GenImg/${filename}`);
      if (!response.ok) throw new Error('无法获取图片资源');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    }
  }

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(Number(e.target.value))
  }

  const handleWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)

    if (value === 0 || isNaN(value)) {
      value = 64
    } else if (value > 1440) {
      value = 1440
    } else if (value < 64) {
      value = 64
    }

    const newWidth = Math.round(value / 16) * 16
    setWidth(newWidth)

    if (aspectLocked && aspectRatio) {
      const newHeight = Math.round((newWidth / aspectRatio) / 16) * 16
      setHeight(Math.min(1440, Math.max(64, newHeight)))
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(Number(e.target.value))
  }

  const handleHeightBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value = Number(e.target.value)

    if (value === 0 || isNaN(value)) {
      value = 64
    } else if (value > 1440) {
      value = 1440
    } else if (value < 64) {
      value = 64
    }

    const newHeight = Math.round(value / 16) * 16
    setHeight(newHeight)

    if (aspectLocked && aspectRatio) {
      const newWidth = Math.round((newHeight * aspectRatio) / 16) * 16
      setWidth(Math.min(1440, Math.max(64, newWidth)))
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        // 如果当前不在加载状态且有提示词，则触发生成
        if (!loading && prompt.trim()) {
          handleSubmit(e as any);
        }
      }
    };

    // 添加全局事件监听
    window.addEventListener('keydown', handleGlobalKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [loading, prompt, handleSubmit]); // 依赖项包含所需的状态和函数

  // 添加对调函数
  const handleSwapDimensions = () => {
    const tempWidth = width;
    setWidth(height);
    setHeight(tempWidth);

    // 切换布局方向
    setIsVertical(!isVertical);

    // 如果当前锁定了宽高比，需要更新比例
    if (aspectLocked) {
      setAspectRatio(1 / aspectRatio);
    }
  };

  const handleLockAspect = () => {
    if (!aspectLocked) {
      setAspectRatio(width / height)
    }
    setAspectLocked(!aspectLocked)
  }

  const handleWidthSliderChange = (value: number) => {
    const newWidth = Math.round(value / 16) * 16
    setWidth(newWidth)

    if (aspectLocked && aspectRatio) {
      const newHeight = Math.round((newWidth / aspectRatio) / 16) * 16
      setHeight(Math.min(1440, Math.max(64, newHeight)))
    }
  }

  const handleHeightSliderChange = (value: number) => {
    const newHeight = Math.round(value / 16) * 16
    setHeight(newHeight)

    if (aspectLocked && aspectRatio) {
      const newWidth = Math.round((newHeight * aspectRatio) / 16) * 16
      setWidth(Math.min(1440, Math.max(64, newWidth)))
    }
  }

  // 添加 useEffect 监听返回事件
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showConfig) {
        e.preventDefault();
        setShowConfig(false);
        // 重新添加历史记录
        window.history.pushState(null, '', '');
      }
    };

    // 打开配置面板时添加历史记录
    if (showConfig) {
      window.history.pushState(null, '', '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showConfig]);

  // 修改图片点击处理函数
  const handlePhotoClick = (photo: PhotoType) => {
    setSelectedPhoto(photo)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background to-background/80"
    >
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent py-2">
          GenImg AI 绘图
        </h1>

        <div className="grid lg:grid-cols-[1fr,450px] gap-8">
          <div>
            <MyPhotoAlbum
              photos={photos}
              onImageClick={handlePhotoClick}
              onDeleteClick={(id) => setDeleteId(id)}
              onSaveImage={handleSaveImage}
            />
          </div>

          <div className="lg:order-last order-first">
            <form onSubmit={handleSubmit}
              className="space-y-4 lg:space-y-6 lg:sticky lg:top-6 bg-content1 rounded-2xl p-4 lg:p-6 shadow-medium"
            >
              <div className="space-y-6">
                <div>
                  <label className="text-lg font-medium mb-2 block">提示词</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请用英文描述您想要生成的图像 ..."
                    minRows={3}
                    maxRows={20}
                    size="lg"
                    classNames={{
                      inputWrapper: "bg-default-100",
                      innerWrapper: "break-words whitespace-pre-wrap",
                      input: "min-h-unit-12 h-auto leading-normal",
                      base: "w-full",
                      label: "font-normal"
                    }}
                  />
                </div>

                <div className="hidden lg:block space-y-6">
                  <div>
                    <label className="text-lg font-medium mb-2 block">负面提示词（可选）</label>
                    <Textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="请用英文描述图像中不应出现的元素 ..."
                      minRows={2}
                      maxRows={10}
                      size="lg"
                      classNames={{
                        inputWrapper: "bg-default-100",
                        innerWrapper: "break-words whitespace-pre-wrap",
                        input: "min-h-unit-12 h-auto leading-normal",
                        base: "w-full",
                        label: "font-normal"
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium">宽度</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={width}
                                onChange={handleWidthChange}
                                onBlur={handleWidthBlur}
                                className="w-20 text-right rounded-lg text-sm bg-default-100 border-none px-3 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={64}
                                max={1440}
                                step={1}
                              />
                              <span className="text-sm text-default-500">px</span>
                            </div>
                          </div>
                          <Slider
                            value={width}
                            onChange={handleWidthSliderChange}
                            minValue={64}
                            maxValue={1440}
                            step={1}
                            className="max-w-md"
                            color="primary"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium">高度</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={height}
                                onChange={handleHeightChange}
                                onBlur={handleHeightBlur}
                                className="w-20 text-right rounded-lg text-sm bg-default-100 border-none px-3 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={64}
                                max={1440}
                                step={16}
                              />
                              <span className="text-sm text-default-500">px</span>
                            </div>
                          </div>
                          <Slider
                            value={height}
                            onChange={handleHeightSliderChange}
                            minValue={64}
                            maxValue={1440}
                            step={16}
                            className="max-w-md"
                            color="primary"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={handleSwapDimensions}
                          className="text-default-600 hover:text-primary"
                          aria-label="对调宽高"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                          </svg>
                        </Button>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={handleLockAspect}
                          className={`text-default-600 hover:text-primary ${aspectLocked ? 'text-primary' : ''}`}
                          aria-label="锁定宽高比"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={aspectLocked ?
                              "M12 10V6a2 2 0 1 1 4 0v4a2 2 0 1 1-4 0zm-2 4h8v8H10v-8zm8-4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1" :
                              "M12 10V6a2 2 0 1 1 4 0v4M10 14h8v8H10v-8zm8-4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1"} />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['2:1', '16:9', '3:2', '4:3', '1:1'].map((ratio) => {
                        // 根据当前布局方向决定显示的比例
                        const displayRatio = isVertical ? ratio.split(':').reverse().join(':') : ratio;
                        // 点击时使用正确的比例值
                        const [w, h] = displayRatio.split(':').map(Number);

                        return (
                          <Button
                            key={ratio}
                            size="sm"
                            variant="flat"
                            className="w-16 text-sm"
                            onPress={() => {
                              if (w > h) {
                                setWidth(1024)
                                setHeight(Math.round((1024 * h / w) / 16) * 16)
                              } else {
                                setHeight(1024)
                                setWidth(Math.round((1024 * w / h) / 16) * 16)
                              }
                            }}
                          >
                            {displayRatio}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  isLoading={loading}
                  color="primary"
                  size="lg"
                  className="flex-1 shadow-lg hover:shadow-xl transition-shadow"
                  variant="shadow"
                >
                  {loading ? '生成中 ...' : '生成图像'}
                </Button>

                <Button
                  isIconOnly
                  className="lg:hidden"
                  size="lg"
                  variant="flat"
                  onPress={() => setShowConfig(true)}
                  aria-label="打开配置"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 桌面端 Modal */}
      {isWideScreen && selectedPhoto && (
        <DesktopPhotoModal
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
          handleCopySettings={handleCopySettings}
          toast={toast}
        />
      )}

      {/* 移动端 Modal */}
      <MobilePhotoModal
        selectedPhoto={selectedPhoto}
        isWideScreen={isWideScreen}
        setSelectedPhoto={setSelectedPhoto}
        handleCopySettings={handleCopySettings}
        toast={toast}
      />

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
        classNames={{
          base: "bg-content1 dark:bg-content1 rounded-large",
          header: "border-b-[1px] border-default-200",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalBody>
            <div className="flex flex-col items-center gap-6 py-4 px-2">
              <div className="p-3 rounded-full bg-danger/10">
                <Trash2 className="w-8 h-8 text-danger" />
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xl font-medium">删除确认</h3>
                <p className="text-default-500">
                  确定要从生成记录中移除这张图片吗？
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  color="danger"
                  className="flex-1"
                  variant="solid"
                  onPress={() => deleteId && handleDelete(deleteId)}
                >
                  删除
                </Button>
                <Button
                  variant="flat"
                  className="flex-1"
                  onPress={() => setDeleteId(null)}
                >
                  取消
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        id='mobile-advanced-config-modal'
        size="full"
        scrollBehavior="inside"
        className="lg:hidden"
      >
        <ModalContent>
          <ModalBody className="py-6">
            <div className="space-y-6">
              <div>
                <label className="text-lg font-medium mb-2 block">负面提示词（可选）</label>
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="请用英文描述图像中不应出现的元素 ..."
                  minRows={2}
                  maxRows={10}
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-default-100",
                    innerWrapper: "break-words whitespace-pre-wrap",
                    input: "min-h-unit-12 h-auto leading-normal",
                    base: "w-full",
                    label: "font-normal"
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">宽度</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={width}
                            onChange={handleWidthChange}
                            onBlur={handleWidthBlur}
                            className="w-20 text-right rounded-lg text-sm bg-default-100 border-none px-3 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={64}
                            max={1440}
                            step={1}
                          />
                          <span className="text-sm text-default-500">px</span>
                        </div>
                      </div>
                      <Slider
                        value={width}
                        onChange={handleWidthSliderChange}
                        minValue={64}
                        maxValue={1440}
                        step={1}
                        className="max-w-md"
                        color="primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">高度</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={height}
                            onChange={handleHeightChange}
                            onBlur={handleHeightBlur}
                            className="w-20 text-right rounded-lg text-sm bg-default-100 border-none px-3 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={64}
                            max={1440}
                            step={16}
                          />
                          <span className="text-sm text-default-500">px</span>
                        </div>
                      </div>
                      <Slider
                        value={height}
                        onChange={handleHeightSliderChange}
                        minValue={64}
                        maxValue={1440}
                        step={16}
                        className="max-w-md"
                        color="primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleSwapDimensions}
                      className="text-default-600 hover:text-primary"
                      aria-label="对调宽高"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                      </svg>
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleLockAspect}
                      className={`text-default-600 hover:text-primary ${aspectLocked ? 'text-primary' : ''}`}
                      aria-label="锁定宽高比"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={aspectLocked ?
                          "M12 10V6a2 2 0 1 1 4 0v4a2 2 0 1 1-4 0zm-2 4h8v8H10v-8zm8-4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1" :
                          "M12 10V6a2 2 0 1 1 4 0v4M10 14h8v8H10v-8zm8-4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1"} />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['2:1', '16:9', '3:2', '4:3', '1:1'].map((ratio) => {
                    // 根据当前布局方向决定显示的比例
                    const displayRatio = isVertical ? ratio.split(':').reverse().join(':') : ratio;
                    // 点击时使用正确的比例值
                    const [w, h] = displayRatio.split(':').map(Number);

                    return (
                      <Button
                        key={ratio}
                        size="sm"
                        variant="flat"
                        className="w-16 text-sm"
                        onPress={() => {
                          if (w > h) {
                            setWidth(1024)
                            setHeight(Math.round((1024 * h / w) / 16) * 16)
                          } else {
                            setHeight(1024)
                            setWidth(Math.round((1024 * w / h) / 16) * 16)
                          }
                        }}
                      >
                        {displayRatio}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

    </div>
  )
}
