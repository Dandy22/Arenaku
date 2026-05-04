import { Button, Modal } from "antd";
import { HiOutlineExclamationCircle } from "react-icons/hi2";

interface DeleteModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onDelete: () => void;
  dataName?: string;
}

const DeleteModal = ({
  open,
  loading,
  onCancel,
  onDelete,
  dataName,
}: DeleteModalProps) => {
  return (
    <Modal
      open={open}
      closable={false}
      footer={null}
      centered
      onCancel={onCancel}
      width={325}>
      <div className="flex flex-col gap-6 bg-dark-700">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center">
            <div className="flex size-[50px] items-center justify-center rounded-full border-1 border-slate-200">
              <div className="flex size-[44px] items-center justify-center rounded-full bg-red-500">
                <HiOutlineExclamationCircle className="size-[30px] text-red-50" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-[10px]">
            {/* Judulnya dibikin clean aja */}
            <h1 className="text-center text-[18px] font-bold leading-[22.68px] text-slate-600">
              Hapus Data
            </h1>

            {/* Nama datanya masuk ke deskripsi sini */}
            <p className="text-center text-[13px] leading-[18px] text-slate-400">
              Apakah Anda yakin ingin menghapus data{" "}
              {dataName ? (
                <strong className="text-slate-500">"{dataName}"</strong>
              ) : (
                "ini"
              )}
              ?
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            className="!py-5 rounded-md border-0  py-3 text-[14px] font-medium  !text-slate-400 hover:!bg-slate-50 "
            type="default"
            block
            disabled={loading}
            onClick={onCancel}>
            Batal
          </Button>
          <Button
            className="!py-5 h-full rounded-md !bg-red-500  py-3 text-[14px] !font-semibold  !text-white hover:!bg-red-50 hover:!border-red-500 hover:!text-red-500"
            block
            type="text"
            loading={loading}
            onClick={onDelete}>
            Hapus
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
