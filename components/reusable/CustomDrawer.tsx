import { Drawer, Space } from "antd";
import React, { ReactNode } from "react";

interface Props {
  title: ReactNode; // <--- Ubah ini jadi ReactNode
  open: boolean;
  setOpen: (val: boolean) => void;
  content: ReactNode;
  footer?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

const CustomDrawer: React.FC<Props> = ({
  title,
  content,
  open,
  setOpen,
  footer,
  extra,
  className,
}) => {
  const onClose = () => {
    setOpen(false);
  };

  const text = (
    <div className="flex items-center gap-3 text-xl font-bold text-slate-700">
      {title}
    </div>
  );

  return (
    <Drawer
      title={text}
      onClose={onClose}
      // HAPUS style={{ padding: "24px" }} dari sini
      styles={{
        // Padding 24px diletakkan di sini agar title tidak nempel tembok,
        // tapi border bawah header tetap mentok sampai ujung drawer.
        header: {
          padding: "16px 24px",
          borderBottom: "1px solid #f0f0f0",
        },
        body: {
          padding: "24px", // Content tetap punya jarak aman
        },
        footer: {
          padding: "16px 24px",
          borderTop: "none", // <--- UBAH INI JADI "none" atau hapus baris ini
        },
      }}
      classNames={{
        body: "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
      }}
      width={480} // Sesuaikan lebar agar konsisten dengan drawer lain
      open={open}
      className={className}
      extra={<Space>{extra}</Space>}
      footer={footer}>
      {content}
    </Drawer>
  );
};

export default CustomDrawer;
