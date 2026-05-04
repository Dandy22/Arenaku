"use client";

import { Button, Select, Table, TableProps } from "antd";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import InputSearch from "./InputSearch";
import {
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";

interface DataTableProps {
  dataSource: TableProps<any>["dataSource"];
  columns: TableProps<any>["columns"];
  page?: number;
  limit?: number;
  totalPage?: number;
  totalData?: number;
  isLoading?: boolean;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const DataTable = ({
  dataSource,
  columns,
  page = 1,
  limit = 10,
  totalPage = 1,
  totalData = 0,
  isLoading = false,
  searchPlaceholder,
  showSearch,
}: DataTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQueryParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    params.set(key, value);

    if (key !== "page") {
      params.set("page", "1");
    }

    router.push(`?${params.toString()}`);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      updateQueryParams("page", String(page - 1));
    }
  };

  const handleNextPage = () => {
    if (page < totalPage) {
      updateQueryParams("page", String(page + 1));
    }
  };

  return (
    <div className="space-y-5">
      {showSearch && (
        <div className="flex items-center justify-between">
          <div className="w-full max-w-sm">
            <InputSearch
              placeholder={searchPlaceholder}
              className="!h-11 !rounded-full"
            />
          </div>
        </div>
      )}
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={false}
        rowHoverable={false}
        scroll={{ x: "max-content" }}
        className="data-table custom-scrollbar"
        loading={{
          spinning: isLoading,
          size: "large",
        }}
        locale={{
          emptyText: !isLoading && (
            <div className="flex flex-col items-center justify-center py-10">
              <Image
                src="/empty-data.svg"
                width={240}
                height={240}
                alt="empty"
                className="h-auto w-40"
              />
              <h1 className="text-base font-bold text-slate-600">
                Data tidak ditemukan
              </h1>
              <p className="text-slate-400">
                Tidak ada data yang dapat ditampilkan
              </p>
            </div>
          ),
        }}
        footer={() => (
          <div className="flex w-full items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="hidden md:block !text-slate-400">Tampilkan</span>
              <Select
                value={Number(limit)}
                className="!text-slate-400"
                options={[
                  { value: 10, label: "10 / halaman" },
                  { value: 25, label: "25 / halaman" },
                  { value: 50, label: "50 / halaman" },
                ]}
                suffixIcon={<HiOutlineChevronDown className="text-lg" />}
                onChange={(value) => updateQueryParams("limit", String(value))}
              />

              <span className="hidden md:block !text-slate-400">
                dari {totalData} data
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* BUTTON KEMBALI */}
              <Button
                onClick={handlePrevPage}
                disabled={page === 1}
                icon={<HiOutlineChevronLeft className="text-base" />}
                className="
        !h-10
        !rounded-full
        !border-0
        !bg-slate-50
        !text-slate-500
        hover:!bg-slate-200
        hover:!text-slate-700
        !shadow-none
        disabled:!bg-slate-50
        disabled:!text-slate-300
      ">
                <span className="hidden sm:block font-medium">Kembali</span>
              </Button>

              {/* BUTTON LANJUT */}
              <Button
                onClick={handleNextPage}
                disabled={page === totalPage}
                icon={<HiOutlineChevronRight className="text-base" />}
                iconPlacement="end"
                className="
        !h-10
        !rounded-full
        !border-0
        !bg-purple-50
        !text-purple-600
        hover:!bg-purple-100
        hover:!text-purple-700
        !shadow-none
        disabled:!bg-purple-50
        disabled:!text-purple-300
      ">
                <span className="hidden sm:block font-medium">Lanjut</span>
              </Button>
            </div>
          </div>
        )}
        onChange={(_, __, sorter) => {
          const params = new URLSearchParams(searchParams?.toString());

          if (!Array.isArray(sorter) && sorter?.columnKey) {
            if (sorter.order) {
              params.set(
                sorter.columnKey.toString(),
                sorter.order === "ascend" ? "asc" : "desc",
              );
            } else {
              params.delete(sorter.columnKey.toString());
            }

            router.push(`?${params.toString()}`);
          }
        }}
      />
    </div>
  );
};

export default DataTable;
