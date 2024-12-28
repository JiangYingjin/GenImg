import React from 'react';
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { Save, Trash2 } from 'lucide-react'
import { PhotoType } from './types'

interface MyPhotoAlbumProps {
  photos: PhotoType[];
  onImageClick: (photo: PhotoType) => void;
  onDeleteClick: (id: number) => void;
  onSaveImage: (filename: string) => void;
}

export default function MyPhotoAlbum({
  photos,
  onImageClick,
  onDeleteClick,
  onSaveImage,
}: MyPhotoAlbumProps) {
  const handlePhotoClick = (photo: PhotoType) => {
    onImageClick(photo); // 使用 photo.result 传递详细数据
  };

  return (
    <div className="my-photo-album">
      <RowsPhotoAlbum
        photos={photos.map((photo) => ({
          src: photo.src,
          width: photo.width,
          height: photo.height,
          key: photo.id.toString(), // 为每张图片添加唯一的 React key
          title: photo.prompt, // 使用提示词（prompt）作为图片的标题
        }))}
        onClick={({ photo }) => {
          const clickedPhoto = photos.find((p) => p.src === photo.src);
          if (clickedPhoto) {
            handlePhotoClick(clickedPhoto);
          }
        }}
        render={{
          extras: (_, { photo }) => {
            const foundPhoto = photos.find((p) => p.src === photo.src);

            return (
              // 右上角按钮
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200">

                <div className="absolute top-3 right-3 flex gap-1">
                  <div
                    role="button"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-white/90 transition-all shadow-lg cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveImage(foundPhoto?.filename ?? '');
                    }}
                    aria-label="保存图片"
                  >
                    <Save className="w-4 h-4 text-black" />
                  </div>

                  <div
                    role="button"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-danger transition-all shadow-lg cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (foundPhoto) {
                        onDeleteClick(foundPhoto.id);
                      }
                    }}
                    aria-label="删除图片"
                  >
                    <Trash2 className="w-4 h-4 text-black group-hover:text-white" />
                  </div>
                </div>
              </div>
            );
          },
        }}
        spacing={3} // 设置图片之间的间距
        rowConstraints={{
          maxPhotos: 3  // 限制每行最多3张图片
        }}
        targetRowHeight={300}  // 设置合适的行高
      />
    </div>
  );
}