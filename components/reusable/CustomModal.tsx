import { Button, Modal } from "antd";
import React from "react";
import { HiXMark } from "react-icons/hi2";

interface BaseModalProps {
  width?: number;
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  titleBorder?: boolean;
  onClose: () => void;
}

const CustomModal = ({
  width,
  open,
  title,
  footer,
  children,
  titleBorder = true,
  onClose,
}: BaseModalProps) => {
  return (
    <Modal
      centered
      open={open}
      closable={false}
      footer={footer || null}
      width={width}>
      <div className="flex flex-col gap-4">
        <div
          className={`flex justify-between border-slate-200 ${titleBorder ? "border-b pb-4" : ""}`}>
          <h1 className="text-xl font-bold text-slate-700">{title}</h1>
          <Button
            type="text"
            onClick={onClose}
            icon={
              <HiXMark
                strokeWidth={0.3}
                className="h-[26px] w-[26px] text-slate-500 group-hover:brightness-75"
              />
            }
            className="group flex rounded-md !p-2 !text-slate-500"
            styles={{ icon: { height: 24 } }}
          />
        </div>
        {children}
      </div>
    </Modal>
  );
};

export default CustomModal;
