import { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'GenImg AI 绘图',
  icons: {
    icon: 'icon/black-forest-labs.jpg',
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}