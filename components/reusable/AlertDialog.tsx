import { Button } from "antd";
import Modal from "antd/es/modal/Modal";
import { IconType } from "react-icons";
import { HiOutlineExclamationCircle } from "react-icons/hi2";

interface AlertDialogProps {
  open: boolean;
  danger?: boolean;
  icon?: IconType;
  title?: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  confirmButtonClassName?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const AlertDialog = ({
  open,
  danger,
  icon,
  title,
  description,
  confirmText,
  cancelText,
  showCancel = true,
  confirmButtonClassName,
  onConfirm,
  onCancel,
}: AlertDialogProps) => {
  const IconComponent: IconType = icon || HiOutlineExclamationCircle;

  return (
    <Modal
      open={open}
      width={340}
      centered
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        },
        footer: { marginTop: 24 },
      }}
      closable={false}
      footer={
        <div className="flex w-full gap-4">
          {showCancel && (
            <Button
              className="!h-full w-full rounded-md !border-slate-200 !py-2.5 !font-semibold !text-slate-500 !shadow-none hover:!bg-slate-100 hover:!text-slate-600"
              onClick={onCancel}>
              {cancelText || "Batal"}
            </Button>
          )}
          <Button
            type="primary"
            className={`!h-full w-full rounded-md !py-2.5 !font-medium !shadow-none ${
              danger && "!bg-red-500 !text-white hover:!bg-red-600"
            } ${confirmButtonClassName}`}
            onClick={onConfirm}>
            {confirmText || "Setuju"}
          </Button>
        </div>
      }>
      {icon && (
        <IconComponent
          className={`h-fit w-fit rounded-full p-2 text-4xl ring-4 ${danger ? "bg-red-100 text-red-500 ring-red-50" : "bg-blue-100 text-primary ring-blue-50"}`}
        />
      )}
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-lg font-bold text-slate-600">{title}</h1>
        {typeof description === "string" ? (
          <p className="text-center   !text-slate-400 ">{description}</p>
        ) : (
          <>{description}</>
        )}
      </div>
    </Modal>
  );
};

export default AlertDialog;
